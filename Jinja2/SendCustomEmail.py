import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def sendEmail(
    from_email,
    to_email,
    subject,
    plain_body="",
    html_body="",
    cc=None,
    bcc=None,
    smtp_server="10.127.226.91",
    smtp_port=25
):

    cc = cc or []
    bcc = bcc or []

    msg = MIMEMultipart("alternative")

    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject

    if cc:
        msg["Cc"] = ", ".join(cc)

    # Plain text version
    msg.attach(
        MIMEText(
            plain_body if plain_body else "Please view the HTML report.",
            "plain"
        )
    )

    # HTML version
    if html_body:
        msg.attach(
            MIMEText(
                html_body,
                "html"
            )
        )

    recipients = [to_email] + cc + bcc

    try:

        print("\n========== EMAIL DETAILS ==========")
        print("From    :", from_email)
        print("To      :", to_email)

        if cc:
            print("CC      :", ", ".join(cc))

        print("Subject :", subject)
        print("SMTP    :", smtp_server)
        print("===================================\n")

        with smtplib.SMTP(
            smtp_server,
            smtp_port,
            timeout=30
        ) as server:

            server.sendmail(
                from_email,
                recipients,
                msg.as_string()
            )

        print("Email sent successfully.")
        return True

    except Exception as e:

        print("Email sending failed.")
        print("Error:", e)

        return False
    """
    Create Configuration Table

    Example:

    CREATE TABLE email_configuration (
        id INT PRIMARY KEY,
        site VARCHAR(50),
        plant VARCHAR(50),
        sender_email VARCHAR(100)
    );

    Create Helper Function

    Future file:

    # ConfigManager.py

    def getSenderEmail(site, plant):

        # Future DB Query

        return sender_email

    Replace 

    Instead of:

    from_email="anika1.kumar@ril.com"

    Use:

    senderEmail = getSenderEmail(
        config["site"],
        config["plant"]
    )

    sendEmail(
        from_email=senderEmail,
        ...
    )
        """