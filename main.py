import logging
import base64
import os
import json
import threading
from components.stt import SpeechClientBridge
from flask import Flask, render_template, request
from twilio.twiml.voice_response import VoiceResponse, Connect, Stream
from flask_sockets import Sockets
from google.cloud.speech import RecognitionConfig, StreamingRecognitionConfig

HTTP_SERVER_PORT = 8000

config = RecognitionConfig(
    encoding=RecognitionConfig.AudioEncoding.MULAW,
    sample_rate_hertz=8000,
    language_code="en-US",
)
streaming_config = StreamingRecognitionConfig(config=config, interim_results=True)

app = Flask(__name__)
sockets = Sockets(app)

@app.route("/answer", methods=['GET', 'POST'])
def answer_call():
    resp = VoiceResponse()
    connect = Connect()
    connect.stream(url=f'wss://{os.getenv("SERVER")}/connection')
    resp.append(connect)
    return str(resp)

def on_transcription_response(response):
    if not response.results:
        return

    result = response.results[0]
    if not result.alternatives:
        return

    transcription = result.alternatives[0].transcript
    if result.is_final:
        print("Transcription: " + transcription)

@sockets.route('/connection', websocket=True)
def transcript(ws):
    print("WS connection opened")
    bridge = SpeechClientBridge(streaming_config, on_transcription_response)
    t = threading.Thread(target=bridge.start)
    t.start()
    while not ws.closed:
        message = ws.receive()
        if message is None:
            bridge.add_request(None)
            bridge.terminate()
            break

        data = json.loads(message)
        if data["event"] in ("connected", "start"):
            print(f"Media WS: Received event '{data['event']}': {message}")
            continue
        if data["event"] == "media":
            media = data["media"]
            chunk = base64.b64decode(media["payload"])
            bridge.add_request(chunk)
        if data["event"] == "stop":
            print(f"Media WS: Received event 'stop': {message}")
            print("Stopping...")
            break

    bridge.terminate()
    print("WS connection closed")

if __name__ == '__main__':
    app.logger.setLevel(logging.DEBUG)
    from gevent import pywsgi
    from geventwebsocket.handler import WebSocketHandler
    server = pywsgi.WSGIServer(('', HTTP_SERVER_PORT), app, handler_class=WebSocketHandler)
    print("Server listening")
    server.serve_forever()
