import os
import json
import logging
from flask import Flask, request
from flask_sockets import Sockets

app = Flask(__name__)
sockets = Sockets(app)

HTTP_SERVER_PORT = os.getenv('PORT', 8000)

@sockets.route('/connection', websocket=True)
def handle_socket(ws):
    app.logger.info("WebSocket connection accepted")
    marks = []
    interaction_count = 0

    while not ws.closed:
        message = ws.receive()
        if message:
            data = json.loads(message)
            event_type = data.get('event')

            if event_type == 'start':
                stream_sid = data['start']['streamSid']
                call_sid = data['start']['callSid']
                app.logger.info(f"Starting Media Stream for {stream_sid}")

            elif event_type == 'media':
                app.logger.info("Media data received")

            elif event_type == 'mark':
                label = data['mark']['name']
                app.logger.info(f"Audio completed mark {label}")
                marks = [m for m in marks if m != label]

            elif event_type == 'stop':
                app.logger.info(f"Media stream ended.")
                break

    app.logger.info("WebSocket connection closed.")

if __name__ == '__main__':
    app.logger.setLevel(logging.DEBUG)
    from gevent import pywsgi
    from geventwebsocket.handler import WebSocketHandler
    server = pywsgi.WSGIServer(('', HTTP_SERVER_PORT), app, handler_class=WebSocketHandler)
    app.logger.info(f"Server listening on http://localhost:{HTTP_SERVER_PORT}")
    server.serve_forever()
