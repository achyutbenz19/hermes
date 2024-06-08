require("dotenv").config();
require("colors");
const express = require("express");
const ExpressWs = require("express-ws");

const { LanguageModelProcessor } = require("./components/model");
const { Socket } = require("./components/socket");
const { SpeechToText } = require("./components/stt");
const { TextToSpeech } = require("./components/tts");
const { VectorStore } = require("./components/vectorstore");

const app = express();
ExpressWs(app);

const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.json({ message: "hermes, live!" });
});

app.post("/answer", (req, res) => {
  res.status(200);
  res.type("text/xml");
  res.end(`
    <Response>
      <Say>Himalayan resturant at Niles, how can I help you?</Say>
      <Connect>
        <Stream url="wss://${process.env.SERVER}/connection" />
      </Connect>
    </Response>
    `);
});

app.ws("/connection", (ws) => {
  ws.on("error", console.error);
  let streamSid;
  let callSid;

  const model = new LanguageModelProcessor();
  const socket = new Socket(ws);
  const stt = new SpeechToText();
  const tts = new TextToSpeech({});
  const vectorstore = new VectorStore();

  let marks = [];
  let interactionCount = 0;

  ws.on("message", function message(data) {
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
      ws.send(
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
});

app.listen(PORT);
console.log(`Server running on port ${PORT}`);
