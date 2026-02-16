from datetime import datetime
import pandas as pd
import logging

logger = logging.getLogger(__name__)

def run_csv_ingestion_pipeline(session, sample_file: str = None):
    """
    Pipeline 1: CSV Ingestion
    Extract: Read CSV file
    Transform: Clean and validate data
    Load: Insert into SQLite
    """
    from models import PipelineRun
    
    run = PipelineRun(
        pipeline_name="csv_ingestion",
        status="running",
        started_at=datetime.utcnow()
    )
    session.add(run)
    session.commit()
    
    logs = []
    
    try:
        # EXTRACT
        logs.append(f"[{datetime.utcnow()}] Starting CSV ingestion pipeline")
        
        if sample_file:
            csv_path = sample_file
        else:
            csv_path = "data/sample_sales.csv"
        
        logs.append(f"[{datetime.utcnow()}] Reading CSV from {csv_path}")
        df = pd.read_csv(csv_path)
        
        original_count = len(df)
        logs.append(f"[{datetime.utcnow()}] Extracted {original_count} records")
        
        # TRANSFORM
        logs.append(f"[{datetime.utcnow()}] Transforming data...")
        
        # Clean: remove duplicates
        df = df.drop_duplicates()
        duplicates_removed = original_count - len(df)
        if duplicates_removed > 0:
            logs.append(f"[{datetime.utcnow()}] Removed {duplicates_removed} duplicate records")
        
        # Clean: handle missing values
        df = df.fillna("")
        
        # Validate: ensure required columns exist
        required_cols = ['date', 'product', 'quantity', 'price']
        for col in required_cols:
            if col not in df.columns:
                raise ValueError(f"Missing required column: {col}")
        
        # Add computed fields
        df['total'] = df['quantity'] * df['price']
        df['processed_at'] = datetime.utcnow().isoformat()
        
        logs.append(f"[{datetime.utcnow()}] Transformation complete")
        
        # LOAD
        logs.append(f"[{datetime.utcnow()}] Loading data to database...")
        
        # Save to a processed data table (as simple JSON for demo)
        records = df.to_dict('records')
        
        # Store in a simple file-based "table" for demo
        import json
        output_file = "data/processed_sales.json"
        
        # Load existing data
        existing = []
        if os.path.exists(output_file):
            with open(output_file, 'r') as f:
                existing = json.load(f)
        
        # Append new records
        existing.extend(records)
        
        with open(output_file, 'w') as f:
            json.dump(existing, f, indent=2, default=str)
        
        records_processed = len(records)
        logs.append(f"[{datetime.utcnow()}] Successfully loaded {records_processed} records")
        
        # Update run status
        run.status = "success"
        run.completed_at = datetime.utcnow()
        run.records_processed = records_processed
        run.logs = "\n".join(logs)
        session.commit()
        
        return {"status": "success", "records_processed": records_processed, "run_id": run.id}
        
    except Exception as e:
        logs.append(f"[{datetime.utcnow()}] ERROR: {str(e)}")
        run.status = "failed"
        run.completed_at = datetime.utcnow()
        run.error_message = str(e)
        run.logs = "\n".join(logs)
        session.commit()
        
        return {"status": "failed", "error": str(e), "run_id": run.id}

import os
