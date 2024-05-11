import { Server } from "socket.io";
import { LanguageModelProcessor } from '@/components/model'
import { Socket } from '@/components/socket'
import { SpeechToText } from "@/components/stt";
import { TextToSpeech } from "@/components/tts";
import { VectorStore } from "@/components/vectorstore";

const SocketHandler = (req, res) => {
    if (res.socket.server.io) {
        console.log('Socket is already running');
    } else {
        console.log('Socket is initializing');
        const io = new Server(res.socket.server);

        io.on("connection", (socket) => {
            console.log("Client connected");
            let streamSid;
            let callSid;
            const model = new LanguageModelProcessor();
            const stt = new SpeechToText();
            const tts = new TextToSpeech({});
            const vectorstore = new VectorStore();
            let marks = [];
            let interactionCount = 0;

            socket.on("message", async function message(data) {
                const msg = JSON.parse(data);
                if (msg.event === "start") {
                    streamSid = msg.start.streamSid;
                    callSid = msg.start.callSid;
                    console.log(
                        `Twilio -> Starting Media Stream for ${streamSid}`.underline.red,
                    );
                } else if (msg.event === "media") {
                    stt.send(msg.media.payload);
                } else if (msg.event === "mark") {
                    console.log(
                        `Twilio -> Audio completed mark (${msg.sequenceNumber}): ${msg.mark.name}`.red,
                    );
                    marks = marks.filter(m => m !== msg.mark.name);
                } else if (msg.event === "stop") {
                    console.log(`Twilio -> Media stream ${streamSid} ended.`.underline.red);
                }
            });

            stt.on("transcription", async (text) => {
                if (!text) return;
                console.log(`Interaction ${interactionCount} – STT -> GPT: ${text}`.yellow);
                const relevantDocs = await vectorstore.queryVectorStore(text);
                const modelResponse = await model.chat(text, relevantDocs);
                const modelReply = {
                    partialResponseIndex: null,
                    partialResponse: modelResponse,
                };
                interactionCount += 1;
                tts.generate(modelReply, interactionCount);
            });

            tts.on("speech", (responseIndex, audio, label, icount) => {
                console.log(`Interaction ${icount}: TTS -> TWILIO: ${label}`.blue);
                socket.emit("audio", { responseIndex, audio, label });
            });

            socket.on("audiosent", (markLabel) => {
                marks.push(markLabel);
            });
        });
    }
    res.end();
};

export default SocketHandler;
