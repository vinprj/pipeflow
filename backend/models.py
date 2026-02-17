from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///data/pipeflow.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    pipeline_name = Column(String, nullable=False)
    status = Column(String, nullable=False)  # running, success, failed
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    records_processed = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    logs = Column(Text, nullable=True)

class PipelineSchedule(Base):
    __tablename__ = "pipeline_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    pipeline_name = Column(String, nullable=False)
    cron_expression = Column(String, nullable=False)  # e.g., "0 * * * *" for hourly
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    pipeline_run_id = Column(Integer, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, nullable=False)  # success, error, warning
    created_at = Column(DateTime, default=datetime.utcnow)
    read = Column(Boolean, default=False)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
