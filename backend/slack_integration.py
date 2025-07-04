# slack_integration.py
import requests
import json
import sys
import getopt
from slack_key import key as social_key

all_key = '__________'


def send_slack_message(message, channel="social"):
    # Properly format the JSON payload
    payload = {
        "text": message
    }
    
    # Select the appropriate webhook
    webhook = social_key if channel == "social" else all_key
    
    try:
        # Send with proper headers
        r = requests.post(
            webhook,
            data=json.dumps(payload),
            headers={'Content-Type': 'application/json'}
        )
        
        # Check for success (200) or other success codes
        if r.status_code == 200:
            return True
        else:
            print(f"Slack webhook returned status code: {r.status_code}")
            print(f"Response: {r.text}")
            return False
            
    except Exception as e:
        print(f"Exception sending Slack message: {e}")
        return False

def main(argv):
    try:
        opts, args = getopt.getopt(argv, "hm:", ["message="])
    except getopt.GetoptError:
        sys.exit(2)

    # default message
    message = "can we have a meeting at 6:30"

    for opt, arg in opts:
        if opt == '-h':
            sys.exit()
        elif opt in ("-m", "--message"):
            message = arg

    success = send_slack_message(message)
    if success:
        print("Message sent successfully")
    else:
        print("Failed to send message")

if __name__ == "__main__":
    main(sys.argv[1:])