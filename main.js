require('dotenv').config();
require('colors');
const express = require('express');
const ExpressWs = require('express-ws');

const { LanguageModelProcessor } = require('./components/model');
const { Socket } = require('./components/socket');
const { SpeechToText } = require('./components/stt');
const { TextToSpeech } = require('./components/tts');

const app = express();
ExpressWs(app);

const PORT = process.env.PORT || 8000;

app.post('/incoming', (req, res) => {
    res.status(200);
    res.type('text/xml');
    res.end(`
  <Response>
    <Connect>
      <Stream url="wss://${process.env.SERVER}/connection" />
    </Connect>
  </Response>
  `);
});

app.ws('/connection', (ws) => {
    ws.on('error', console.error);
    let streamSid;
    let callSid;

    const model = new LanguageModelProcessor();
    const socket = new Socket(ws);
    const stt = new SpeechToText();
    const tts = new TextToSpeech({});

    let marks = [];
    let interactionCount = 0;

    ws.on('message', function message(data) {
        const msg = JSON.parse(data);
        if (msg.event === 'start') {
            streamSid = msg.start.streamSid;
            callSid = msg.start.callSid;
            socket.setStreamSid(streamSid);
            // model.setCallSid(callSid);
            console.log(`Twilio -> Starting Media Stream for ${streamSid}`.underline.red);
            tts.generate({ partialResponseIndex: null, partialResponse: 'Hello! I understand you\'re looking for a pair of AirPods, is that correct?' }, 1);
        } else if (msg.event === 'media') {
            stt.send(msg.media.payload);
        } else if (msg.event === 'mark') {
            const label = msg.mark.name;
            console.log(`Twilio -> Audio completed mark (${msg.sequenceNumber}): ${label}`.red);
            marks = marks.filter(m => m !== msg.mark.name);
        } else if (msg.event === 'stop') {
            console.log(`Twilio -> Media stream ${streamSid} ended.`.underline.red);
        }
    });

    stt.on('utterance', async (text) => {
        if (marks.length > 0 && text?.length > 5) {
            console.log('Twilio -> Interruption, Clearing stream'.red);
            ws.send(
                JSON.stringify({
                    streamSid,
                    event: 'clear',
                })
            );
        }
    });

    stt.on('transcription', async (text) => {
        if (!text) { return; }
        console.log(`Interaction ${interactionCount} – STT -> GPT: ${text}`.yellow);
        // model.completion(text, interactionCount);
        interactionCount += 1;
    });

    // model.on('gptreply', async (gptReply, icount) => {
    //     console.log(`Interaction ${icount}: GPT -> TTS: ${gptReply.partialResponse}`.green);
    //     tts.generate(gptReply, icount);
    // });

    tts.on('speech', (responseIndex, audio, label, icount) => {
        console.log(`Interaction ${icount}: TTS -> TWILIO: ${label}`.blue);

        socket.buffer(responseIndex, audio);
    });

    socket.on('audiosent', (markLabel) => {
        marks.push(markLabel);
    });
});

app.listen(PORT);
console.log(`Server running on port ${PORT}`);