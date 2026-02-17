"""Pipeline Scheduler using APScheduler"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from sqlalchemy.orm import Session
import logging

from models import SessionLocal, PipelineSchedule
from pipelines.csv_pipeline import run_csv_ingestion_pipeline
from pipelines.api_pipeline import run_api_fetch_pipeline
from pipelines.aggregation_pipeline import run_aggregation_pipeline
from pipelines.json_pipeline import run_json_ingestion_pipeline
from pipelines.webscraping_pipeline import run_webscraping_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

PIPELINE_FUNCTIONS = {
    "csv_ingestion": run_csv_ingestion_pipeline,
    "api_fetch": run_api_fetch_pipeline,
    "data_aggregation": run_aggregation_pipeline,
    "json_ingestion": run_json_ingestion_pipeline,
    "web_scraping": run_webscraping_pipeline,
}

def execute_pipeline(pipeline_name: str):
    """Execute a pipeline and update schedule info"""
    db = SessionLocal()
    try:
        logger.info(f"Scheduled execution of {pipeline_name}")
        pipeline_func = PIPELINE_FUNCTIONS.get(pipeline_name)
        
        if pipeline_func:
            result = pipeline_func(db)
            logger.info(f"Pipeline {pipeline_name} completed: {result}")
            
            # Update last_run_at for the schedule
            schedule = db.query(PipelineSchedule).filter(
                PipelineSchedule.pipeline_name == pipeline_name,
                PipelineSchedule.enabled == True
            ).first()
            
            if schedule:
                schedule.last_run_at = datetime.utcnow()
                db.commit()
        else:
            logger.error(f"Pipeline {pipeline_name} not found")
    except Exception as e:
        logger.error(f"Error executing scheduled pipeline {pipeline_name}: {e}")
    finally:
        db.close()

def load_schedules():
    """Load all enabled schedules from database and add to scheduler"""
    db = SessionLocal()
    try:
        schedules = db.query(PipelineSchedule).filter(PipelineSchedule.enabled == True).all()
        
        for schedule in schedules:
            try:
                trigger = CronTrigger.from_crontab(schedule.cron_expression)
                scheduler.add_job(
                    execute_pipeline,
                    trigger=trigger,
                    args=[schedule.pipeline_name],
                    id=f"schedule_{schedule.id}",
                    replace_existing=True
                )
                logger.info(f"Loaded schedule {schedule.id} for {schedule.pipeline_name}: {schedule.cron_expression}")
            except Exception as e:
                logger.error(f"Error loading schedule {schedule.id}: {e}")
    finally:
        db.close()

def start_scheduler():
    """Start the scheduler and load schedules"""
    load_schedules()
    scheduler.start()
    logger.info("Scheduler started")

def stop_scheduler():
    """Stop the scheduler"""
    scheduler.shutdown()
    logger.info("Scheduler stopped")

def reload_schedules():
    """Reload all schedules (useful after adding/updating)"""
    scheduler.remove_all_jobs()
    load_schedules()
    logger.info("Schedules reloaded")
