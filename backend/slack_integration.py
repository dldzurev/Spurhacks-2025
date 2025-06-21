#slack
import requests
import sys
import getopt
from slack_key import key as social_key

all_key = 'https://hooks.slack.com/services/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'

def send_slack_message(message, channel="social"):
    payload = '{"text":"%s"}' % message
    webhook = social_key if channel == "social" else all_key
    try:
        r = requests.post(
            webhook,
            data=payload
        )
        return r.status_code == 200
    except Exception:
        return False

def mane(argv):
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

    send_slack_message(message)

if __name__ == "__main__":
    mane(sys.argv[1:])
