import { Server as WebSocketServer } from 'ws';

export default function handler(req, res) {
    if (res.socket.server.ws) {
        console.log('Socket is already running');
    } else {
        console.log('Starting WebSocket server');
        const wss = new WebSocketServer({ noServer: true });
        res.socket.server.ws = wss;

        wss.on('connection', (ws) => {
            let streamSid;
            let callSid;
            let marks = [];
            let interactionCount = 0;

            const model = new LanguageModelProcessor();
            const socket = new Socket(ws);
            const stt = new SpeechToText();
            const tts = new TextToSpeech({});
            const vectorstore = new VectorStore();

            ws.on('message', function message(data) {
                const msg = JSON.parse(data);
                if (msg.event === "start") {
                    streamSid = msg.start.streamSid;
                    callSid = msg.start.callSid;
                    socket.setStreamSid(streamSid);
                    console.log(`Twilio -> Starting Media Stream for ${streamSid}`);
                } else if (msg.event === "media") {
                    stt.send(msg.media.payload);
                } else if (msg.event === "mark") {
                    console.log(`Twilio -> Audio completed mark (${msg.sequenceNumber}): ${msg.mark.name}`);
                    marks = marks.filter((m) => m !== msg.mark.name);
                } else if (msg.event === "stop") {
                    console.log(`Twilio -> Media stream ${streamSid} ended.`);
                }
            });

            stt.on("transcription", async (text) => {
                if (!text) return;
                console.log(`Interaction ${interactionCount} – STT -> GPT: ${text}`);
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
                console.log(`Interaction ${icount}: TTS -> TWILIO: ${label}`);
                socket.buffer(responseIndex, audio);
            });

            socket.on("audiosent", (markLabel) => {
                marks.push(markLabel);
            });
        });

        res.socket.server.on('upgrade', (request, socket, head) => {
            console.log('Parsing session from request...');
            if (request.headers['sec-websocket-protocol']) {
                wss.handleUpgrade(request, socket, head, (ws) => {
                    wss.emit('connection', ws, request);
                });
            } else {
                socket.destroy();
            }
        });
    }
    res.end();
}
