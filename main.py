import os
from twilio.rest import Client

account_sid = os.environ["ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
personal_number = os.environ["PERSONAL_PHONE_NUMBER"]
twilio_number = os.environ["TWILIO_PHONE_NUMBER"]

client = Client(account_sid, auth_token)

call = client.calls.create(
  url="http://demo.twilio.com/docs/voice.xml",
  to=personal_number,
  from_=twilio_number
)

print(call)
