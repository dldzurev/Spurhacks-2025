from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from gmail_api import send_email

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
            return {"response": f"Email sent successfully to {address}"}
        else:
            return {"response": f"Failed to send email to {address}"}
    
    elif action_type == "phone":
        number = request.get("number", "")
        task = request.get("task", "")
        return {"response": f"calling {number} to {task}"}
    
    elif action_type == "calendar":
        date = request.get("date", "")
        location = request.get("location", "")
        event = request.get("event", "")
        return {"response": f"you have to {event} on {date} at {location}"}
    
    else:
        return {"response": "Please select a valid action"}