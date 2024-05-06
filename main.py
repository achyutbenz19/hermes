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
from twilio.rest import Client

HTTP_SERVER_PORT = 8000

call_sessions = {}

config = RecognitionConfig(
    encoding=RecognitionConfig.AudioEncoding.MULAW,
    sample_rate_hertz=8000,
    language_code="en-US",
)
streaming_config = StreamingRecognitionConfig(config=config, interim_results=True)

app = Flask(__name__)
sockets = Sockets(app)

twilio_account_sid = os.getenv("ACCOUNT_SID")
twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
twilio_client = Client(twilio_account_sid, twilio_auth_token)

@app.route("/answer", methods=['GET', 'POST'])
def answer_call():
    resp = VoiceResponse()
    connect = Connect()
    connect.stream(url=f'wss://{os.getenv("SERVER")}/connection')
    resp.append(connect)
    return str(resp)

def on_transcription_response(response, call_sid):
    if not response.results:
        return

    result = response.results[0]
    if not result.alternatives:
        return

    transcription = result.alternatives[0].transcript
    if result.is_final:
        print("Final Transcription: " + transcription)
        call_sessions[call_sid]['transcription'] = transcription
        notify_twilio_to_speak(call_sid)

def notify_twilio_to_speak(call_sid):
    transcription = call_sessions[call_sid]['transcription']
    try:
        twilio_client.calls(call_sid).update(
            twiml=f'<Response><Say voice="alice">{transcription}</Say></Response>'
        )
    except Exception as e:
        print("Failed to update call:", e)

@sockets.route('/connection', websocket=True)
def transcript(ws):
    print("WS connection opened")
    call_sid = None
    bridge = SpeechClientBridge(streaming_config, lambda response: on_transcription_response(response, call_sid))
    t = threading.Thread(target=bridge.start)
    t.start()

    while not ws.closed:
        message = ws.receive()
        if message is None:
            bridge.terminate()
            break

        data = json.loads(message)
        if data["event"] == "start":
            call_sid = data["start"]["callSid"]
            call_sessions[call_sid] = {'transcription': ''}
            continue
        if data["event"] == "media":
            media = data["media"]
            chunk = base64.b64decode(media["payload"])
            bridge.add_request(chunk)
        if data["event"] == "stop":
            print("Stopping...")
            break

    bridge.terminate()
    print("WS connection closed")

if __name__ == '__main__':
    from gevent import pywsgi
    from geventwebsocket.handler import WebSocketHandler
    server = pywsgi.WSGIServer(('', HTTP_SERVER_PORT), app, handler_class=WebSocketHandler)
    print("Server listening")
    server.serve_forever()