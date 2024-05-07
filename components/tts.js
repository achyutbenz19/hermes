const EventEmitter = require("events");
const { Buffer } = require("node:buffer");

class TextToSpeech extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.config.voiceId ||= process.env.VOICE_ID;
    this.nextExpectedIndex = 0;
    this.speechBuffer = {};
  }

  async fetchModule() {
    if (!this.fetch) {
      this.fetch = (await import('node-fetch')).default;
    }
    return this.fetch;
  }

  async generate(gptReply, interactionCount) {
    const { partialResponseIndex, partialResponse } = gptReply;
    if (!partialResponse) {
      return;
    }

    const fetch = await this.fetchModule();

    try {
      const outputFormat = "ulaw_8000";
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.config.voiceId}/stream?output_format=${outputFormat}&optimize_streaming_latency=3`,
        {
          method: "POST",
          headers: {
            "xi-api-key": process.env.XI_API_KEY,
            "Content-Type": "application/json",
            accept: "audio/wav",
          },
          body: JSON.stringify({
            model_id: process.env.XI_MODEL_ID,
            text: partialResponse,
          }),
        },
      );
      const audioArrayBuffer = await response.arrayBuffer();
      this.emit(
        "speech",
        partialResponseIndex,
        Buffer.from(audioArrayBuffer).toString("base64"),
        partialResponse,
        interactionCount,
      );
    } catch (err) {
      console.error("Error occurred in TextToSpeech service");
      console.error(err);
    }
  }
}

module.exports = { TextToSpeech };
