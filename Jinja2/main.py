from datetime import datetime
import time
from MLModelLlama3 import generateReport
from SendCustomEmail import sendEmail
from ModelManager import getModelName
from ReportScheduler import scheduleReport

def getReportType(template):

    template_map = {
        "summarised": "summary",
        "tablewise": "tablewise",
        "custom": "custom"
    }
    return template_map.get(
        template,
        "summary"
    )

def getRecipients(emailString):

    return [
        email.strip()
        for email in emailString.split(",")
        if email.strip()
    ]


def sendScheduledReport(config):

    print("\n===== SCHEDULED JOB STARTED =====")

    report_type = getReportType(
        config["template"]
    )

    selectedModel = getModelName(
        config["model"]
    )

    report = generateReport(
        reportType=report_type,
        filePath="data.csv",
        customPrompt=config["customPrompt"],
        site=config["site"],
        plant=config["plant"],
        model=selectedModel
    )

    recipients = getRecipients(
        config["emails"]
    )

    today = datetime.now().strftime("%d-%m-%Y")

    subject = (
        f"{config['scheduleType'].title()} "
        f"Highlights Report - {today}"
    )

    for email in recipients:

        sendEmail(
            from_email="anika1.kumar@ril.com",
            to_email=email,
            subject=subject,
            plain_body="Please view the attached report.",
            html_body=report
        )

# TEST CONFIG
config = {
    "site": "VMD",
    "plant": "NCP",
    "emails": "avani5.patel@ril.com",
    "template": "summarised",
    "model": "llama 3",
    "scheduleType": "weekly",
    "scheduleTime": "14:30",
    "customPrompt": ""
}

# 1 - EXECUTE NOW
sendScheduledReport(config)

# 2 - SCHEDULE
scheduleReport(
    config["scheduleType"],
    config["scheduleTime"],
    sendScheduledReport,
    config
)
print(
    f"Report scheduled for "
    f"{config['scheduleType']} at "
    f"{config['scheduleTime']}"
)

# Keep program alive for scheduler
while True:
    time.sleep(60)