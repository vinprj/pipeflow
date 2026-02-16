"""Main FastAPI application for PipeFlow"""
import asyncio
import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import pandas as pd

from app.pipelines.etl_pipeline import ETLPipeline, PipelineStatus, PipelineConfig
from app.services.sample_data import generate_census_data, generate_weather_data

# Database setup
DATABASE_URL = "sqlite+aiosqlite:///./pipeflow.db"
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

# Scheduler
scheduler = AsyncIOScheduler()


# Database Models
class PipelineRunDB(Base):
    __tablename__ = "pipeline_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(String, index=True)
    pipeline_name = Column(String)
    status = Column(String)
    start_time = Column(DateTime)
    end_time = Column(DateTime, nullable=True)
    records_extracted = Column(Integer, default=0)
    records_transformed = Column(Integer, default=0)
    records_loaded = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    logs = Column(Text, nullable=True)


class PipelineConfigDB(Base):
    __tablename__ = "pipeline_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(String, unique=True, index=True)
    name = Column(String)
    description = Column(String)
    schedule = Column(String, nullable=True)
    enabled = Column(Boolean, default=True)
    config_json = Column(Text)


# Pydantic Models
class PipelineRun(BaseModel):
    id: Optional[int] = None
    pipeline_id: str
    pipeline_name: str
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    records_extracted: int = 0
    records_transformed: int = 0
    records_loaded: int = 0
    error_message: Optional[str] = None
    retry_count: int = 0
    logs: Optional[str] = None


class PipelineConfig(BaseModel):
    pipeline_id: str
    name: str
    description: str
    schedule: Optional[str] = None
    enabled: bool = True
    config: dict = {}


class PipelineCreate(BaseModel):
    name: str
    description: str
    source_type: str = Field(..., pattern="^(csv|api)$")
    source_path: Optional[str] = None
    source_url: Optional[str] = None
    schedule: Optional[str] = None
    enabled: bool = True


class PipelineExecute(BaseModel):
    pipeline_id: str


class DashboardStats(BaseModel):
    total_pipelines: int
    active_pipelines: int
    total_runs: int
    successful_runs: int
    failed_runs: int
    avg_records_processed: float


# Global state
pipelines: dict[str, ETLPipeline] = {}


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    await init_db()
    
    # Load existing pipelines from DB
    async with async_session() as session:
        from sqlalchemy import select
        result = await session.execute(select(PipelineConfigDB))
        configs = result.scalars().all()
        
        for config in configs:
            pipeline = ETLPipeline(
                config=PipelineConfig(
                    pipeline_id=config.pipeline_id,
                    name=config.name,
                    description=config.description,
                    schedule=config.schedule,
                    enabled=config.enabled,
                    config={}
                )
            )
            pipelines[config.pipeline_id] = pipeline
    
    # Schedule background tasks
    scheduler.start()
    
    yield
    
    scheduler.shutdown()


app = FastAPI(
    title="PipeFlow API",
    description="ETL Pipeline Dashboard - REST API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Helper functions
async def save_pipeline_config(config: PipelineConfig):
    """Save pipeline configuration to database"""
    async with async_session() as session:
        from sqlalchemy import select
        result = await session.execute(
            select(PipelineConfigDB).where(PipelineConfigDB.pipeline_id == config.pipeline_id)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            existing.name = config.name
            existing.description = config.description
            existing.schedule = config.schedule
            existing.enabled = config.enabled
            existing.config_json = str(config.config)
        else:
            db_config = PipelineConfigDB(
                pipeline_id=config.pipeline_id,
                name=config.name,
                description=config.description,
                schedule=config.schedule,
                enabled=config.enabled,
                config_json=str(config.config)
            )
            session.add(db_config)
        
        await session.commit()


async def save_pipeline_run(run: PipelineRun):
    """Save pipeline run to database"""
    async with async_session() as session:
        db_run = PipelineRunDB(
            pipeline_id=run.pipeline_id,
            pipeline_name=run.pipeline_name,
            status=run.status,
            start_time=run.start_time,
            end_time=run.end_time,
            records_extracted=run.records_extracted,
            records_transformed=run.records_transformed,
            records_loaded=run.records_loaded,
            error_message=run.error_message,
            retry_count=run.retry_count,
            logs=run.logs
        )
        session.add(db_run)
        await session.commit()


# API Routes
@app.get("/")
async def root():
    return {"message": "PipeFlow API - ETL Pipeline Dashboard", "version": "1.0.0"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/pipelines", response_model=List[dict])
async def list_pipelines():
    """List all pipelines"""
    return [
        {
            "pipeline_id": pid,
            "name": p.config.name,
            "description": p.config.description,
            "status": p.status.value,
            "schedule": p.config.schedule,
            "enabled": p.config.enabled,
            "last_run": p.last_run.isoformat() if p.last_run else None
        }
        for pid, p in pipelines.items()
    ]


@app.post("/api/pipelines", response_model=dict)
async def create_pipeline(config: PipelineCreate):
    """Create a new pipeline"""
    import uuid
    pipeline_id = f"pipeline_{uuid.uuid4().hex[:8]}"
    
    pipeline_config = PipelineConfig(
        pipeline_id=pipeline_id,
        name=config.name,
        description=config.description,
        schedule=config.schedule,
        enabled=config.enabled,
        config={
            "source_type": config.source_type,
            "source_path": config.source_path,
            "source_url": config.source_url
        }
    )
    
    pipeline = ETLPipeline(config=pipeline_config)
    pipelines[pipeline_id] = pipeline
    
    await save_pipeline_config(pipeline_config)
    
    return {
        "pipeline_id": pipeline_id,
        "name": config.name,
        "message": "Pipeline created successfully"
    }


@app.get("/api/pipelines/{pipeline_id}", response_model=dict)
async def get_pipeline(pipeline_id: str):
    """Get pipeline details"""
    if pipeline_id not in pipelines:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    p = pipelines[pipeline_id]
    return {
        "pipeline_id": pipeline_id,
        "name": p.config.name,
        "description": p.config.description,
        "status": p.status.value,
        "schedule": p.config.schedule,
        "enabled": p.config.enabled,
        "config": p.config.config,
        "last_run": p.last_run.isoformat() if p.last_run else None,
        "stats": {
            "total_runs": len(p.runs),
            "successful_runs": sum(1 for r in p.runs if r["status"] == "completed"),
            "failed_runs": sum(1 for r in p.runs if r["status"] == "failed")
        }
    }


@app.post("/api/pipelines/{pipeline_id}/run")
async def run_pipeline(pipeline_id: str, background_tasks: BackgroundTasks):
    """Execute a pipeline"""
    if pipeline_id not in pipelines:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    pipeline = pipelines[pipeline_id]
    
    async def execute():
        await pipeline.run()
        # Save run to database
        if pipeline.last_run:
            run = PipelineRun(
                pipeline_id=pipeline_id,
                pipeline_name=pipeline.config.name,
                status=pipeline.status.value,
                start_time=pipeline.last_run,
                end_time=pipeline.end_time,
                records_extracted=pipeline.extracted_count,
                records_transformed=pipeline.transformed_count,
                records_loaded=pipeline.loaded_count,
                error_message=pipeline.error,
                retry_count=pipeline.retry_count,
                logs="\n".join(pipeline.logs)
            )
            await save_pipeline_run(run)
    
    background_tasks.add_task(execute)
    
    return {
        "message": "Pipeline execution started",
        "pipeline_id": pipeline_id,
        "status": "running"
    }


@app.get("/api/pipelines/{pipeline_id}/runs", response_model=List[dict])
async def get_pipeline_runs(pipeline_id: str, limit: int = 10):
    """Get pipeline run history"""
    if pipeline_id not in pipelines:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    pipeline = pipelines[pipeline_id]
    return pipeline.runs[-limit:][::-1]


@app.get("/api/runs", response_model=List[dict])
async def get_all_runs(limit: int = 50):
    """Get all pipeline runs"""
    async with async_session() as session:
        from sqlalchemy import select
        result = await session.execute(
            select(PipelineRunDB).order_by(PipelineRunDB.start_time.desc()).limit(limit)
        )
        runs = result.scalars().all()
        
        return [
            {
                "id": run.id,
                "pipeline_id": run.pipeline_id,
                "pipeline_name": run.pipeline_name,
                "status": run.status,
                "start_time": run.start_time.isoformat(),
                "end_time": run.end_time.isoformat() if run.end_time else None,
                "records_extracted": run.records_extracted,
                "records_transformed": run.records_transformed,
                "records_loaded": run.records_loaded,
                "error_message": run.error_message,
                "retry_count": run.retry_count
            }
            for run in runs
        ]


@app.get("/api/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """Get dashboard statistics"""
    async with async_session() as session:
        from sqlalchemy import select, func
        
        # Total pipelines
        result = await session.execute(select(func.count(PipelineConfigDB.id)))
        total_pipelines = result.scalar() or 0
        
        # Active pipelines
        result = await session.execute(
            select(func.count(PipelineConfigDB.id)).where(PipelineConfigDB.enabled == True)
        )
        active_pipelines = result.scalar() or 0
        
        # Total runs
        result = await session.execute(select(func.count(PipelineRunDB.id)))
        total_runs = result.scalar() or 0
        
        # Successful runs
        result = await session.execute(
            select(func.count(PipelineRunDB.id)).where(PipelineRunDB.status == "completed")
        )
        successful_runs = result.scalar() or 0
        
        # Failed runs
        result = await session.execute(
            select(func.count(PipelineRunDB.id)).where(PipelineRunDB.status == "failed")
        )
        failed_runs = result.scalar() or 0
        
        # Average records processed
        result = await session.execute(
            select(func.avg(PipelineRunDB.records_loaded)).where(PipelineRunDB.status == "completed")
        )
        avg_records = result.scalar() or 0.0
        
        return DashboardStats(
            total_pipelines=total_pipelines,
            active_pipelines=active_pipelines,
            total_runs=total_runs,
            successful_runs=successful_runs,
            failed_runs=failed_runs,
            avg_records_processed=round(avg_records, 2)
        )


@app.post("/api/sample-data/generate")
async def generate_sample_data():
    """Generate sample census and weather data"""
    # Generate census data
    census_df = generate_census_data()
    census_path = "backend/data/census_data.csv"
    os.makedirs(os.path.dirname(census_path), exist_ok=True)
    census_df.to_csv(census_path, index=False)
    
    # Generate weather data
    weather_df = generate_weather_data()
    weather_path = "backend/data/weather_data.csv"
    weather_df.to_csv(weather_path, index=False)
    
    return {
        "message": "Sample data generated",
        "census_records": len(census_df),
        "weather_records": len(weather_df),
        "census_path": census_path,
        "weather_path": weather_path
    }


@app.delete("/api/pipelines/{pipeline_id}")
async def delete_pipeline(pipeline_id: str):
    """Delete a pipeline"""
    if pipeline_id not in pipelines:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    del pipelines[pipeline_id]
    
    async with async_session() as session:
        from sqlalchemy import delete
        await session.execute(
            delete(PipelineConfigDB).where(PipelineConfigDB.pipeline_id == pipeline_id)
        )
        await session.commit()
    
    return {"message": "Pipeline deleted", "pipeline_id": pipeline_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
