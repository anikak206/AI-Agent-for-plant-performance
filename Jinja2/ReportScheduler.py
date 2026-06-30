from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()
scheduler.start()

print("Report Scheduler Started...")


def scheduleReport(
    scheduleType,
    scheduleTime,
    callbackFunction,
    config
):

    hour, minute = map(
        int,
        scheduleTime.split(":")
    )

    if scheduleType.lower() == "weekly":

        scheduler.add_job(
            callbackFunction,
            trigger="cron",
            day_of_week="mon",
            hour=hour,
            minute=minute,
            args=[config]
        )

    elif scheduleType.lower() == "monthly":

        scheduler.add_job(
            callbackFunction,
            trigger="cron",
            day=1,
            hour=hour,
            minute=minute,
            args=[config]
        )