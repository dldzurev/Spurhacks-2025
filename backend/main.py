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
    allow_origins=["http://localhost:3001", "http://127.0.0.1:3001"],  
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
    elif action_type == "notion" or action_type == "document":
        # Handle both 'notion' and 'document' types for backward compatibility
        project = request.get("project", "")
        content = request.get("content", "")
        
        # Also check for alternative field names
        if not project:
            project = request.get("title", "")
        if not content:
            content = request.get("message", "")
        
        if not project:
            return {"response": "No project idea provided."}
        
        try:
            # Prepare input for the notion script
            input_data = project
            if content:
                input_data += f"\n\nAdditional details:\n{content}"
            
            # Use the current Python interpreter instead of venv path
            # This will use whatever Python is currently running your FastAPI app
            result = subprocess.run(
                [sys.executable, "notion_API.py"],
                input=input_data.encode(),
                capture_output=True,
                timeout=60
            )
            
            if result.returncode == 0:
                return {"response": f"Notion project page created successfully for '{project}'. Check your Notion workspace for the detailed project plan."}
            else:
                error_msg = result.stderr.decode().strip()
                return {"response": f"Failed to create Notion project: {error_msg}"}
                
        except subprocess.TimeoutExpired:
            return {"response": "Notion project creation timed out. Please try again."}
        except Exception as e:
            return {"response": f"Error running Notion integration: {str(e)}"}
    else:
        return {"response": "Please select a valid action"}