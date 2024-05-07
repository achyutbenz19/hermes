const EventEmitter = require('events');
const uuid = require('uuid');

class Socket extends EventEmitter {
    constructor(websocket) {
        super();
        this.ws = websocket;
        this.expectedAudioIndex = 0;
        this.audioBuffer = {};
        this.streamSid = '';
    }

    setStreamSid(streamSid) {
        this.streamSid = streamSid;
    }

    buffer(index, audio) {
        if (index === null) {
            this.sendAudio(audio);
        } else if (index === this.expectedAudioIndex) {
            this.sendAudio(audio);
            this.expectedAudioIndex++;

            while (Object.prototype.hasOwnProperty.call(this.audioBuffer, this.expectedAudioIndex)) {
                const bufferedAudio = this.audioBuffer[this.expectedAudioIndex];
                this.sendAudio(bufferedAudio);
                this.expectedAudioIndex++;
            }
        } else {
            this.audioBuffer[index] = audio;
        }
    }

    sendAudio(audio) {
        this.ws.send(
            JSON.stringify({
                streamSid: this.streamSid,
                event: 'media',
                media: {
                    payload: audio,
                },
            })
        );
        const markLabel = uuid.v4();
        this.ws.send(
            JSON.stringify({
                streamSid: this.streamSid,
                event: 'mark',
                mark: {
                    name: markLabel
                }
            })
        );
        this.emit('audiosent', markLabel);
    }
}

module.exports = { Socket };