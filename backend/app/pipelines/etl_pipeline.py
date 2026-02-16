"""ETL Pipeline implementation with error handling and retry logic"""
import asyncio
import time
from datetime import datetime
from enum import Enum
from typing import Optional, Any
import pandas as pd
import random


class PipelineStatus(Enum):
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"


class PipelineConfig:
    """Pipeline configuration"""
    def __init__(
        self,
        pipeline_id: str,
        name: str,
        description: str,
        schedule: Optional[str] = None,
        enabled: bool = True,
        config: dict = None
    ):
        self.pipeline_id = pipeline_id
        self.name = name
        self.description = description
        self.schedule = schedule
        self.enabled = enabled
        self.config = config or {}


class ETLPipeline:
    """ETL Pipeline with Extract, Transform, Load stages"""
    
    MAX_RETRIES = 3
    RETRY_DELAY = 2  # seconds
    
    def __init__(self, config: PipelineConfig):
        self.config = config
        self.status = PipelineStatus.IDLE
        self.start_time: Optional[datetime] = None
        self.end_time: Optional[datetime] = None
        self.last_run: Optional[datetime] = None
        self.error: Optional[str] = None
        
        # Counters
        self.extracted_count = 0
        self.transformed_count = 0
        self.loaded_count = 0
        
        # Retry
        self.retry_count = 0
        
        # Logs
        self.logs: list[str] = []
        
        # Run history
        self.runs: list[dict] = []
        
        # Data storage
        self._extracted_data: Optional[pd.DataFrame] = None
        self._transformed_data: Optional[pd.DataFrame] = None
    
    def _log(self, message: str):
        """Add log entry with timestamp"""
        timestamp = datetime.utcnow().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        self.logs.append(log_entry)
        print(log_entry)
    
    async def run(self):
        """Execute the full ETL pipeline with retry logic"""
        self.start_time = datetime.utcnow()
        self.status = PipelineStatus.RUNNING
        self.logs = []
        self.error = None
        self._log(f"Starting pipeline: {self.config.name}")
        
        while self.retry_count <= self.MAX_RETRIES:
            try:
                # Extract
                self._log("Stage 1/3: Extracting data...")
                await self._extract()
                self._log(f"Extracted {self.extracted_count} records")
                
                # Transform
                self._log("Stage 2/3: Transforming data...")
                await self._transform()
                self._log(f"Transformed {self.transformed_count} records")
                
                # Load
                self._log("Stage 3/3: Loading data...")
                await self._load()
                self._log(f"Loaded {self.loaded_count} records")
                
                # Success
                self.status = PipelineStatus.COMPLETED
                self.end_time = datetime.utcnow()
                self.last_run = self.start_time
                
                duration = (self.end_time - self.start_time).total_seconds()
                self._log(f"Pipeline completed successfully in {duration:.2f}s")
                
                # Record run
                self.runs.append({
                    "pipeline_id": self.config.pipeline_id,
                    "status": "completed",
                    "start_time": self.start_time.isoformat(),
                    "end_time": self.end_time.isoformat(),
                    "records_extracted": self.extracted_count,
                    "records_transformed": self.transformed_count,
                    "records_loaded": self.loaded_count,
                    "duration": duration
                })
                
                return
                
            except Exception as e:
                self.error = str(e)
                self._log(f"Error: {e}")
                
                if self.retry_count < self.MAX_RETRIES:
                    self.retry_count += 1
                    self.status = PipelineStatus.RETRYING
                    self._log(f"Retrying... (attempt {self.retry_count}/{self.MAX_RETRIES})")
                    await asyncio.sleep(self.RETRY_DELAY * self.retry_count)
                else:
                    self.status = PipelineStatus.FAILED
                    self.end_time = datetime.utcnow()
                    self.last_run = self.start_time
                    
                    self._log(f"Pipeline failed after {self.retry_count} retries")
                    
                    # Record failed run
                    self.runs.append({
                        "pipeline_id": self.config.pipeline_id,
                        "status": "failed",
                        "start_time": self.start_time.isoformat(),
                        "end_time": self.end_time.isoformat(),
                        "records_extracted": self.extracted_count,
                        "records_transformed": self.transformed_count,
                        "records_loaded": self.loaded_count,
                        "error": self.error,
                        "retry_count": self.retry_count
                    })
                    
                    return
    
    async def _extract(self):
        """Extract data from source"""
        source_type = self.config.config.get("source_type", "csv")
        
        # Simulate extraction delay
        await asyncio.sleep(random.uniform(0.5, 1.5))
        
        if source_type == "csv":
            source_path = self.config.config.get("source_path", "backend/data/census_data.csv")
            try:
                self._extracted_data = pd.read_csv(source_path)
                self.extracted_count = len(self._extracted_data)
            except FileNotFoundError:
                # Generate sample data if file not found
                self._extracted_data = self._generate_sample_data()
                self.extracted_count = len(self._extracted_data)
        elif source_type == "api":
            # Simulate API extraction
            self._extracted_data = self._generate_sample_data()
            self.extracted_count = len(self._extracted_data)
        else:
            raise ValueError(f"Unknown source type: {source_type}")
        
        if self._extracted_data is None or len(self._extracted_data) == 0:
            raise ValueError("No data extracted")
    
    async def _transform(self):
        """Transform the extracted data"""
        if self._extracted_data is None:
            raise ValueError("No data to transform")
        
        # Simulate transformation delay
        await asyncio.sleep(random.uniform(0.5, 1.5))
        
        df = self._extracted_data.copy()
        
        # Clean data - remove nulls
        initial_count = len(df)
        df = df.dropna()
        self._log(f"Cleaned data: removed {initial_count - len(df)} rows with null values")
        
        # Remove duplicates
        df = df.drop_duplicates()
        
        # Transform operations based on data
        if "age" in df.columns:
            df["age_group"] = pd.cut(df["age"], bins=[0, 18, 35, 50, 65, 100], 
                                      labels=["0-17", "18-34", "35-49", "50-64", "65+"])
        
        if "temperature" in df.columns or "temp" in df.columns:
            temp_col = "temperature" if "temperature" in df.columns else "temp"
            df["temp_category"] = pd.cut(df[temp_col], 
                                          bins=[-50, 0, 15, 25, 35, 50],
                                          labels=["Freezing", "Cold", "Mild", "Warm", "Hot"])
        
        # Add derived metrics
        if "population" in df.columns and "area" in df.columns:
            df["density"] = df["population"] / df["area"].replace(0, 1)
        
        # Add timestamp
        df["processed_at"] = datetime.utcnow().isoformat()
        
        self._transformed_data = df
        self.transformed_count = len(df)
    
    async def _load(self):
        """Load transformed data to destination"""
        if self._transformed_data is None:
            raise ValueError("No data to load")
        
        # Simulate load delay
        await asyncio.sleep(random.uniform(0.3, 1.0))
        
        # In a real app, this would write to SQLite, a database, etc.
        # For demo, we'll store in memory
        self._log(f"Data loaded to destination (simulated)")
        
        self.loaded_count = len(self._transformed_data)
    
    def _generate_sample_data(self) -> pd.DataFrame:
        """Generate sample data if no source provided"""
        import os
        
        # Try to load from default data paths
        possible_paths = [
            "backend/data/census_data.csv",
            "data/census_data.csv",
            "census_data.csv"
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                return pd.read_csv(path)
        
        # Generate synthetic data
        data = {
            "state": random.choices(["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "West Bengal", 
                                     "Gujarat", "Rajasthan", "UP", "MP", "Kerala"], k=100),
            "district": [f"District_{i}" for i in range(1, 101)],
            "population": [random.randint(50000, 5000000) for _ in range(100)],
            "area": [random.uniform(500, 50000) for _ in range(100)],
            "age": [random.randint(0, 80) for _ in range(100)],
            "literacy_rate": [random.uniform(50, 95) for _ in range(100)],
        }
        
        return pd.DataFrame(data)
    
    def get_status(self) -> dict:
        """Get pipeline status"""
        return {
            "pipeline_id": self.config.pipeline_id,
            "name": self.config.name,
            "status": self.status.value,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "last_run": self.last_run.isoformat() if self.last_run else None,
            "extracted_count": self.extracted_count,
            "transformed_count": self.transformed_count,
            "loaded_count": self.loaded_count,
            "error": self.error,
            "retry_count": self.retry_count,
            "logs": self.logs
        }
