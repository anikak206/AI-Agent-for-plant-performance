import csv
import json
from logging import config
def loadPrompt(fileName):

    with open(
        f"prompts/{fileName}",
        "r",
        encoding="utf-8"
    ) as file:

        return file.read()
def loadData(filePath):

    data = []

    with open(filePath, newline="", encoding="utf-8-sig") as file:

        reader = csv.DictReader(file)

        for row in reader:

            cleanRow = {}

            for key, value in row.items():

                cleanKey = key.strip().replace("\ufeff", "")

                cleanRow[cleanKey] = value.strip()

            data.append(cleanRow)

    return data
"""FUTURE ENHANCEMENT:
    Currently KPI data is loaded from a CSV file.
    This function can be replaced with a database connector
   (PostgreSQL/Oracle/SQL Server) to fetch plant KPI data
    dynamically from a centralized enterprise database."""
def loadReportConfig():

    with open(
        "config/ReportConfig.json",
        "r",
        encoding="utf-8"
    ) as file:

        return json.load(file)
def calculateKPIs(data):

    plants = set()
    latestDate = ""

    # Generic numeric column discovery
    numericColumns = {}

    for row in data:

        # Plant collection
        if "Plant" in row:
            plants.add(row.get("Plant", ""))

        # Latest date
        date = row.get("Date", "")
        if date > latestDate:
            latestDate = date

        # Detect all numeric columns automatically
        for column, value in row.items():

            try:
                number = float(str(value).replace(",", "").strip())

                if column not in numericColumns:
                    numericColumns[column] = []

                numericColumns[column].append(number)

            except:
                pass

    # Build generic KPI repository
    allKPIs = {}

    for column, values in numericColumns.items():

        if not values:
            continue

        allKPIs[column] = {
            "sum": round(sum(values), 2),
            "avg": round(sum(values) / len(values), 2),
            "max": max(values),
            "min": min(values)
        }

    # Backward compatibility
    productionKPIs = allKPIs.get(
        "Production",
        {"sum": 0, "avg": 0, "max": 0, "min": 0}
    )

    varianceValues = numericColumns.get(
        "Gain/Loss (Variance)",
        []
    )

    totalGain = round(
        sum(v for v in varianceValues if v > 0),
        2
    )

    totalLoss = round(
        abs(sum(v for v in varianceValues if v < 0)),
        2
    )

    return {
        "week_ending": latestDate,
        "plants": list(plants),

        # Existing keys (DO NOT REMOVE)
        "total_production": productionKPIs["sum"],
        "average_production": productionKPIs["avg"],
        "max_production": productionKPIs["max"],
        "min_production": productionKPIs["min"],
        "total_gain": totalGain,
        "total_loss": totalLoss,

        # New generic KPI repository
        "all_kpis": allKPIs,

        "records": data
    }
def userInput(
    reportType,
    kpis,
    customPrompt="",
    plant="",
    data=None
):

    config = loadReportConfig()
    if reportType not in config:

        raise ValueError(
            f"Unknown report type: {reportType}"
        )

    reportConfig = config[reportType]

    commonPrompt = f"""
You are a professional production reporting assistant.
The USER INSTRUCTION is your highest priority.

You MUST follow the user's instruction while generating the report.

Use ONLY the supplied KPI data.

NEVER write:

- Here is the report
- Here is the Weekly Highlights Report
- Below is the report
- In HTML format

Start directly with the Summary section.

IMPORTANT:

Use ONLY the KPI values supplied below.

DO NOT recalculate.
DO NOT modify values.
DO NOT estimate values.

Return ONLY HTML.

KPI DATA:

{kpis}
"""

    promptFile = reportConfig["prompt"]

    prompt = loadPrompt(promptFile)

    prompt = prompt.replace("{plant}", plant)
    prompt = prompt.replace("{custom_prompt}", customPrompt)
    prompt = prompt.replace("{data}", json.dumps(data, indent=2))

    return commonPrompt + "\n\n" + prompt

    """ delete kpi keep it in place 
        in user fle why it is customPrompt and 
        getInput rendertEMPLATE SHOULD STANDARISED  
        
        options it should be same 
    """