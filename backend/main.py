from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
import os
import sys

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import get_db, PipelineRun, PipelineSchedule, Notification
from pipelines.csv_pipeline import run_csv_ingestion_pipeline
from pipelines.api_pipeline import run_api_fetch_pipeline
from pipelines.aggregation_pipeline import run_aggregation_pipeline
from pipelines.json_pipeline import run_json_ingestion_pipeline
from pipelines.webscraping_pipeline import run_webscraping_pipeline
from scheduler import start_scheduler, stop_scheduler, reload_schedules

app = FastAPI(title="PipeFlow API", description="ETL Pipeline Dashboard Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class PipelineRunResponse(BaseModel):
    id: int
    pipeline_name: str
    status: str
    started_at: datetime
    completed_at: datetime | None = None
    records_processed: int
    error_message: str | None = None
    logs: str | None = None

class PipelineTriggerResponse(BaseModel):
    status: str
    message: str
    run_id: int

class ScheduleCreate(BaseModel):
    pipeline_name: str
    cron_expression: str

class ScheduleResponse(BaseModel):
    id: int
    pipeline_name: str
    cron_expression: str
    enabled: bool
    created_at: datetime
    last_run_at: datetime | None = None
    next_run_at: datetime | None = None

class NotificationResponse(BaseModel):
    id: int
    pipeline_run_id: int
    message: str
    type: str
    created_at: datetime
    read: bool

# Startup/Shutdown events
@app.on_event("startup")
async def startup_event():
    start_scheduler()

@app.on_event("shutdown")
async def shutdown_event():
    stop_scheduler()

# Routes
@app.get("/")
def root():
    return {"message": "PipeFlow API - ETL Pipeline Dashboard"}

@app.get("/api/pipelines", response_model=List[PipelineRunResponse])
def get_pipeline_runs(db: Session = Depends(get_db)):
    """Get all pipeline runs"""
    runs = db.query(PipelineRun).order_by(PipelineRun.started_at.desc()).limit(50).all()
    return runs

@app.get("/api/pipelines/{pipeline_name}", response_model=List[PipelineRunResponse])
def get_pipeline_by_name(pipeline_name: str, db: Session = Depends(get_db)):
    """Get runs for a specific pipeline"""
    runs = db.query(PipelineRun).filter(
        PipelineRun.pipeline_name == pipeline_name
    ).order_by(PipelineRun.started_at.desc()).all()
    return runs

@app.post("/api/pipelines/csv-ingestion/trigger", response_model=PipelineTriggerResponse)
def trigger_csv_pipeline(db: Session = Depends(get_db)):
    """Trigger CSV ingestion pipeline"""
    result = run_csv_ingestion_pipeline(db)
    create_notification(db, result["run_id"], result["status"])
    return PipelineTriggerResponse(
        status=result["status"],
        message=f"Processed {result.get('records_processed', 0)} records",
        run_id=result["run_id"]
    )

@app.post("/api/pipelines/api-fetch/trigger", response_model=PipelineTriggerResponse)
def trigger_api_pipeline(db: Session = Depends(get_db)):
    """Trigger API fetch pipeline"""
    result = run_api_fetch_pipeline(db)
    create_notification(db, result["run_id"], result["status"])
    return PipelineTriggerResponse(
        status=result["status"],
        message=f"Processed {result.get('records_processed', 0)} records",
        run_id=result["run_id"]
    )

@app.post("/api/pipelines/aggregation/trigger", response_model=PipelineTriggerResponse)
def trigger_aggregation_pipeline(db: Session = Depends(get_db)):
    """Trigger data aggregation pipeline"""
    result = run_aggregation_pipeline(db)
    create_notification(db, result["run_id"], result["status"])
    return PipelineTriggerResponse(
        status=result["status"],
        message=f"Aggregated {result.get('records_processed', 0)} records",
        run_id=result["run_id"]
    )

@app.post("/api/pipelines/json-ingestion/trigger", response_model=PipelineTriggerResponse)
def trigger_json_pipeline(db: Session = Depends(get_db)):
    """Trigger JSON ingestion pipeline"""
    result = run_json_ingestion_pipeline(db)
    create_notification(db, result["run_id"], result["status"])
    return PipelineTriggerResponse(
        status=result["status"],
        message=f"Processed {result.get('records_processed', 0)} records",
        run_id=result["run_id"]
    )

@app.post("/api/pipelines/web-scraping/trigger", response_model=PipelineTriggerResponse)
def trigger_webscraping_pipeline(db: Session = Depends(get_db)):
    """Trigger web scraping pipeline"""
    result = run_webscraping_pipeline(db)
    create_notification(db, result["run_id"], result["status"])
    return PipelineTriggerResponse(
        status=result["status"],
        message=f"Scraped {result.get('records_processed', 0)} records",
        run_id=result["run_id"]
    )

@app.get("/api/pipelines/{run_id}/logs")
def get_pipeline_logs(run_id: int, db: Session = Depends(get_db)):
    """Get logs for a specific pipeline run"""
    run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Pipeline run not found")
    return {"logs": run.logs, "status": run.status}

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    total_runs = db.query(PipelineRun).count()
    successful_runs = db.query(PipelineRun).filter(PipelineRun.status == "success").count()
    failed_runs = db.query(PipelineRun).filter(PipelineRun.status == "failed").count()
    
    # Get latest runs per pipeline
    pipelines = ["csv_ingestion", "api_fetch", "data_aggregation", "json_ingestion", "web_scraping"]
    latest_runs = {}
    
    for pipeline in pipelines:
        latest = db.query(PipelineRun).filter(
            PipelineRun.pipeline_name == pipeline
        ).order_by(PipelineRun.started_at.desc()).first()
        if latest:
            latest_runs[pipeline] = {
                "status": latest.status,
                "started_at": latest.started_at.isoformat(),
                "records_processed": latest.records_processed
            }
    
    return {
        "total_runs": total_runs,
        "successful_runs": successful_runs,
        "failed_runs": failed_runs,
        "success_rate": round(successful_runs / total_runs * 100, 1) if total_runs > 0 else 0,
        "latest_runs": latest_runs
    }

# Schedule endpoints
@app.get("/api/schedules", response_model=List[ScheduleResponse])
def get_schedules(db: Session = Depends(get_db)):
    """Get all pipeline schedules"""
    schedules = db.query(PipelineSchedule).order_by(PipelineSchedule.created_at.desc()).all()
    return schedules

@app.post("/api/schedules", response_model=ScheduleResponse)
def create_schedule(schedule: ScheduleCreate, db: Session = Depends(get_db)):
    """Create a new pipeline schedule"""
    new_schedule = PipelineSchedule(
        pipeline_name=schedule.pipeline_name,
        cron_expression=schedule.cron_expression,
        enabled=True,
        created_at=datetime.utcnow()
    )
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    
    # Reload scheduler with new schedule
    reload_schedules()
    
    return new_schedule

@app.patch("/api/schedules/{schedule_id}/toggle")
def toggle_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """Enable or disable a schedule"""
    schedule = db.query(PipelineSchedule).filter(PipelineSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    schedule.enabled = not schedule.enabled
    db.commit()
    
    # Reload scheduler
    reload_schedules()
    
    return {"id": schedule.id, "enabled": schedule.enabled}

@app.delete("/api/schedules/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """Delete a schedule"""
    schedule = db.query(PipelineSchedule).filter(PipelineSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    db.delete(schedule)
    db.commit()
    
    # Reload scheduler
    reload_schedules()
    
    return {"status": "deleted"}

# Notification endpoints
@app.get("/api/notifications", response_model=List[NotificationResponse])
def get_notifications(unread_only: bool = False, db: Session = Depends(get_db)):
    """Get notifications"""
    query = db.query(Notification)
    if unread_only:
        query = query.filter(Notification.read == False)
    notifications = query.order_by(Notification.created_at.desc()).limit(20).all()
    return notifications

@app.patch("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    """Mark notification as read"""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.read = True
    db.commit()
    return {"status": "marked as read"}

@app.patch("/api/notifications/mark-all-read")
def mark_all_notifications_read(db: Session = Depends(get_db)):
    """Mark all notifications as read"""
    db.query(Notification).filter(Notification.read == False).update({"read": True})
    db.commit()
    return {"status": "all notifications marked as read"}

def create_notification(db: Session, run_id: int, status: str):
    """Helper function to create a notification"""
    run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
    if run:
        notification_type = "success" if status == "success" else "error"
        message = f"Pipeline '{run.pipeline_name}' {status}"
        if status == "success":
            message += f" - Processed {run.records_processed} records"
        
        notification = Notification(
            pipeline_run_id=run_id,
            message=message,
            type=notification_type,
            created_at=datetime.utcnow(),
            read=False
        )
        db.add(notification)
        db.commit()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
