import ollama
import json

from GetInput import (
    userInput,
    loadData,
    calculateKPIs,
    loadReportConfig
)

from TemplateRender import renderTemplate


def generateReport(
    reportType,
    filePath="data.csv",
    customPrompt="",
    site="",
    plant="",
    model="llama3"
):
    # Load Data
    data = loadData(filePath)
    """ 
    KPI data is currently sourced from CSV files.
    Future versions can retrieve data directly from centralized plant databases or data warehouses."""

    # Calculate KPIs
    kpis = calculateKPIs(data)

    plantName = plant if plant else (
        ", ".join(kpis["plants"])
        if kpis["plants"]
        else "Plant"
    )

    weekEnding = kpis["week_ending"]

    # Load Report Config
    config = loadReportConfig()

    if reportType not in config:

        raise ValueError(
            f"Unknown report type: {reportType}"
        )

    reportConfig = config[reportType]

    # Build Prompt
    prompt = userInput(
        reportType=reportType,
        kpis=kpis,
        customPrompt=customPrompt,
        plant=plantName,
        data=data
    )

    # Generate Report Content
    response = ollama.chat(
        model=model,
        options={
            "temperature": 0,
            "top_p": 0.1,
            "repeat_penalty": 1.1,
            "num_predict": 1000
        },
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    content = response["message"]["content"]

    templateName = reportConfig["template"]

    # ==================================================
    # SUMMARY REPORT
    # ==================================================

    if reportType == "summary":

        html = renderTemplate(
            templateName,
            {
                "plantName": plantName,
                "weekEnding": weekEnding,
                "content": content,
                "modelName":model
            }
        )

        return html

    # ==================================================
    # TABLEWISE REPORT
    # ==================================================

    elif reportType == "tablewise":

        kpiSummary = ""

        for kpiName, metrics in kpis["all_kpis"].items():

            kpiSummary += (
                f"{kpiName}: "
                f"Sum={metrics['sum']}, "
                f"Avg={metrics['avg']}, "
                f"Max={metrics['max']}, "
                f"Min={metrics['min']}\n"
            )

        observationPrompt = f"""
        Generate ONLY a short professional observation paragraph.

        Week Ending:
        {kpis["week_ending"]}

        KPIs:
        {kpiSummary}

        Rules:
        - Maximum 4 sentences
        - Professional management language
        - No HTML
        - No headings
        - No bullet points
        - No tables
        """

        observationResponse = ollama.chat(
            model=model,
            options={
                "temperature": 0,
                "top_p": 0.1
            },
           messages=[
    {
        "role": "system",
        "content": """
You are an enterprise plant reporting assistant.

Always follow the user's instruction.

Use only the supplied KPI data.

Never invent KPI values.

If the user's request cannot be answered using the provided data,
state that the information is unavailable.
"""
    },
    {
        "role": "user",
        "content": prompt
    }
]
        )

        observations = (
            observationResponse["message"]["content"]
        )

        tableRows = []

        for kpiName, metrics in kpis["all_kpis"].items():

            tableRows.append({
                "key": f"{kpiName} (Sum)",
                "value": metrics["sum"]
            })

            tableRows.append({
                "key": f"{kpiName} (Average)",
                "value": metrics["avg"]
            })

            tableRows.append({
                "key": f"{kpiName} (Maximum)",
                "value": metrics["max"]
            })

            tableRows.append({
                "key": f"{kpiName} (Minimum)",
                "value": metrics["min"]
            })

        html = renderTemplate(
            templateName,
            {
                "plantName": plantName,
                "weekEnding": weekEnding,
                "tableRows": tableRows,
                "observations": observations,
                "modelName":model
            }
        )

        return html

    # ==================================================
    # CUSTOM REPORT
    # ==================================================

    elif reportType == "custom":

        report_body = content
        closing_remark = ""

        # Preferred format
        if "CLOSING_REMARK:" in content:

            parts = content.split("CLOSING_REMARK:", 1)

            report_body = parts[0].replace("REPORT_BODY:", "").strip()
            closing_remark = parts[1].strip()

        # Fallback if Llama writes "In conclusion..."
        elif "In conclusion" in content:

            parts = content.split("In conclusion", 1)

            report_body = parts[0].strip()
            closing_remark = "In conclusion " + parts[1].strip()
        html = renderTemplate(
        templateName,
        {
            "plant_name": plantName,
            "custom_prompt": customPrompt,
            "report_body": report_body,
            "closing_remark": closing_remark,
            "modelName": model
        }
    )

        return html

    else:

        raise ValueError(
            f"Unknown report type: {reportType}"
        )