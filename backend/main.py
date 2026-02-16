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

from models import get_db, PipelineRun
from pipelines.csv_pipeline import run_csv_ingestion_pipeline
from pipelines.api_pipeline import run_api_fetch_pipeline
from pipelines.aggregation_pipeline import run_aggregation_pipeline

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

# Routes
@app.get("/")
def root():
    return {"message": "PipeFlow API - ETL Pipeline Dashboard"}

@app.get("/api/pipelines", response_model=List[PipelineRunResponse])
def get_pipeline_runs(db: Session = Depends(get_db)):
    """Get all pipeline runs"""
    runs = db.query(PipelineRun).order_by(PipelineRun.started_at.desc()).all()
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
    return PipelineTriggerResponse(
        status=result["status"],
        message=f"Processed {result.get('records_processed', 0)} records",
        run_id=result["run_id"]
    )

@app.post("/api/pipelines/api-fetch/trigger", response_model=PipelineTriggerResponse)
def trigger_api_pipeline(db: Session = Depends(get_db)):
    """Trigger API fetch pipeline"""
    result = run_api_fetch_pipeline(db)
    return PipelineTriggerResponse(
        status=result["status"],
        message=f"Processed {result.get('records_processed', 0)} records",
        run_id=result["run_id"]
    )

@app.post("/api/pipelines/aggregation/trigger", response_model=PipelineTriggerResponse)
def trigger_aggregation_pipeline(db: Session = Depends(get_db)):
    """Trigger data aggregation pipeline"""
    result = run_aggregation_pipeline(db)
    return PipelineTriggerResponse(
        status=result["status"],
        message=f"Aggregated {result.get('records_processed', 0)} records",
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
    pipelines = ["csv_ingestion", "api_fetch", "data_aggregation"]
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
