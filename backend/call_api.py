# call_api
import os
from twilio.rest import Client
import keys     

def make_call(number, task):
    client = Client(keys.account_sid, keys.auth_token)

    # Use the task as the message
    message = task

    # Inline TwiML instead of the demo URL
    twiml = f"""
    <Response>
      <Say voice="alice">{message}</Say>
    </Response>
    """

    # Place the call
    call = client.calls.create(
        to=number,
        from_=keys.twilio_number,
        twiml=twiml
    )

    return call.sid
