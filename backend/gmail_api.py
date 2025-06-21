import smtplib

def send_email(receiver, message):
    email = "d.j.spurhacks@gmail.com"
    subject = "Hey this is Everest!"
    
    text = f"Subject: {subject}\n\n{message}"
    
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(email, "xixkcdjytrxuevir")
    server.sendmail(email, receiver, text)
    return True