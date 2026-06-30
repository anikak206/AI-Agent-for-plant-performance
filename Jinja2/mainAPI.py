from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from threading import Thread

from MLModelLlama3 import generateReport
from SendCustomEmail import sendEmail
from ReportScheduler import scheduler
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
def sendReportEmails(report, recipients, subject):

    success_count = 0
    """ 
        Later you can replace:
        from_email="anika1.kumar@ril.com"
        with 
        from_email=config["senderEmail"]       OR
        from_email=databaseConfig["sender_email"]
    """
    for email in recipients:
        
        status = sendEmail(
            from_email="MESAgent@ril.com",
            to_email=email,
            subject=subject,
            plain_body="Please view the attached report.",
            html_body=report
        )

        if status:
            success_count += 1

    return success_count
app = FastAPI(
    title="AI Report Generator",
    version="1.0.0"
)

savedConfigurations = []
"""
Configurations are currently stored in memory.
Replace with a database table to persist user configurations, schedules, and report history."""

# CORS

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REQUEST MODEL

class ExecuteRequest(BaseModel):
    agentName: str = ""
    site: str
    plant: str
    emails: str
    template: str
    model: str
    scheduleType: str
    scheduleTime: str
    customPrompt: str = ""
def sendScheduledReport(config):

    try:

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
        success_count = sendReportEmails(
                        report,
                        recipients,
                        subject
                    )

        print(
            f"Scheduled Emails Sent: "
            f"{success_count}/{len(recipients)}"
        )

    except Exception as e:

        print(
            "SCHEDULED JOB FAILED:",
            str(e)
        )

# Background Report Processing
def processReport(request: ExecuteRequest):

    try:

        report_type = getReportType(request.template)

        selectedModel = getModelName(request.model)

        report = generateReport(
            reportType=report_type,
            filePath="data.csv",
            customPrompt=request.customPrompt,
            site=request.site,
            plant=request.plant,
            model=selectedModel
        )

        today = datetime.now().strftime("%d-%m-%Y")

        subject = (
            f"{request.scheduleType.title()} "
            f"Highlights Report - {today}"
        )

        recipient_list = getRecipients(request.emails)
        success_count = sendReportEmails(
                        report,
                        recipient_list,
                        subject
                    )
                            
        print(f"Emails Sent: {success_count}/{len(recipient_list)}")

    except Exception as e:
        print("Background Job Failed:", e)
# HEALTH CHECK
@app.get("/")
def home():
    return {
        "status": "running",
        "message": "AI Report Backend Running"
    }

# EXECUTE REPORT
@app.post("/execute")
async def execute(request: ExecuteRequest):

    print("\n========== REQUEST RECEIVED ==========")
    print("Site          :", request.site)
    print("Plant         :", request.plant)
    print("Template      :", request.template)
    print("Model         :", request.model)
    print("Schedule Type :", request.scheduleType)
    print("Schedule Time :", request.scheduleTime)
    print("Emails        :", request.emails)
    print("======================================\n")

    Thread(
        target=processReport,
        args=(request,),
        daemon=True
    ).start()

    return {
        "success": True,
        "message": "Report generation started."
    }
@app.post("/schedule-report")
async def schedule_report(request: ExecuteRequest):

    print(request.dict())
    savedConfigurations.append(request.dict())

    scheduleReport(
    request.scheduleType,
    request.scheduleTime,
    sendScheduledReport,
    request.dict()
)

    return {
        "success": True,
        "message": f"{request.scheduleType.title()} Report scheduled successfully!"
    }
@app.get("/configurations/{agentName}")
def getConfigurations(agentName: str):

    workflows = [
        config
        for config in savedConfigurations
        if config["agentName"].strip().lower() == agentName.strip().lower()
    ]

    return workflows
# RUN INFO 
@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
""" These are the Python dependencies you need to install. 
    The code imports FastAPI, Uvicorn, APScheduler, Ollama, Jinja2, and Pydantic.
    
    pip install fastapi uvicorn pydantic apscheduler ollama jinja2
    
    IF PIP IS NOT RECOGNIZED:
    py -m pip install fastapi uvicorn pydantic apscheduler ollama jinja2
    
    Check whether Python is installed :
    python --version

    FastAPI was installed using Python's package manager (pip)
    pip install fastapi

    To run the FastAPI application, the Uvicorn server was installed:
    pip install uvicorn
    
    OR

    IF YOU GET: 'pip' is not recognized as an internal or external command THEN:
    py -m pip install fastapi uvicorn 

    The application can be started using:
    uvicorn mainAPI:app --reload

    OR 

    python -m uvicorn mainAPI:app --reload
 """