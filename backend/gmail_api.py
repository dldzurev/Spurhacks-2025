#mail_api
import smtplib
from gmail_key import key
def send_email(receiver, message):
    email = "d.j.spurhacks@gmail.com"
    subject = "Hey this is Conductor AI!"
    
    text = f"Subject: {subject}\n\n{message}"
    
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(email, key)
    server.sendmail(email, receiver, text)
    return True