# main
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from gmail_api import send_email
from call_api import make_call
from slack_integration import send_slack_message
import subprocess
import sys
import os

app = FastAPI()

# Allow CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/action")
def handle_action(request: dict):
    action_type = request.get("action", "").lower()
    
    if action_type == "email":
        address = request.get("address", "")
        message = request.get("message", "")
        
        # Actually send the email
        if send_email(address, message):
            return {"response": f"email to {address} was sent successfully: {message}"}
        else:
            return {"response": f"incorrect access right failed to send email to {address}"}
    
    elif action_type == "phone":
        number = request.get("number", "")
        task = request.get("task", "")
        
        # Actually make the call
        try:
            call_sid = make_call(number, task)
            return {"response": f"Call initiated to {number} with message: {task}"}
        except Exception as e:
            error_msg = str(e)
            if "unverified" in error_msg.lower():
                return {"response": f"Cannot call {number} - number not verified in Twilio. Please verify the number in your Twilio console first."}
            else:
                return {"response": f"Failed to make call to {number}: {error_msg}"}
    
    elif action_type == "calendar":
        date = request.get("date", "")
        location = request.get("location", "")
        event = request.get("event", "")
        return {"response": f"you have to {event} on {date} at {location}"}
    
    elif action_type == "slack":
        message = request.get("message", "")
        channel = request.get("channel", "social").strip().lower()
        if send_slack_message(message, channel):
            channel_name = "social channel" if channel == "social" else "all channel"
            return {"response": f"successfully sent message to {channel_name}: {message}"}
        else:
            return {"response": "Failed to send message invalid permissions"}
    
    else:
        return {"response": "Please select a valid action"}