import { Server } from "socket.io";
import { LanguageModelProcessor } from '@/components/model'
import { Socket } from '@/components/socket'
import { SpeechToText } from "@/components/stt";
import { TextToSpeech } from "@/components/tts";
import { VectorStore } from "@/components/vectorstore";

const SocketHandler = (req, res) => {
    if (res.socket.server.io) {
        console.log('Socket is already running')
    } else {
        console.log('Socket is initializing')
        const io = new Server(res.socket.server)
        res.socket.server.io = io
        io.on("error", console.error);
        let streamSid;

        const model = new LanguageModelProcessor();
        const socket = new Socket(io);
        const stt = new SpeechToText();
        const tts = new TextToSpeech({});
        const vectorstore = new VectorStore()

        let marks = [];
        let interactionCount = 0;

        io.on("message", function message(data) {
            const msg = JSON.parse(data);
            if (msg.event === "start") {
                streamSid = msg.start.streamSid;
                callSid = msg.start.callSid;
                socket.setStreamSid(streamSid);
                console.log(
                    `Twilio -> Starting Media Stream for ${streamSid}`.underline.red,
                );
            } else if (msg.event === "media") {
                stt.send(msg.media.payload);
            } else if (msg.event === "mark") {
                const label = msg.mark.name;
                console.log(
                    `Twilio -> Audio completed mark (${msg.sequenceNumber}): ${label}`.red,
                );
                marks = marks.filter((m) => m !== msg.mark.name);
            } else if (msg.event === "stop") {
                console.log(`Twilio -> Media stream ${streamSid} ended.`.underline.red);
            }
        });

        stt.on("utterance", async (text) => {
            if (marks.length > 0 && text?.length > 5) {
                console.log("Twilio -> Interruption, Clearing stream".red);
                io.send(
                    JSON.stringify({
                        streamSid,
                        event: "clear",
                    }),
                );
            }
        });

        stt.on("transcription", async (text) => {
            if (!text) {
                return;
            }
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
            socket.buffer(responseIndex, audio);
        });

        socket.on("audiosent", (markLabel) => {
            marks.push(markLabel);
        });
    }
    res.end()
}

export default SocketHandler