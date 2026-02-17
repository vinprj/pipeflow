"""JSON File Ingestion Pipeline"""
import json
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import PipelineRun

def run_json_ingestion_pipeline(db: Session):
    """Extract JSON data, transform, and load to database"""
    logs = []
    pipeline_name = "json_ingestion"
    
    # Create pipeline run
    run = PipelineRun(
        pipeline_name=pipeline_name,
        status="running",
        started_at=datetime.utcnow()
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    
    try:
        logs.append(f"[{datetime.utcnow()}] Starting JSON ingestion pipeline...")
        
        # Sample JSON data (in real scenario, read from file)
        sample_data = [
            {"id": 1, "name": "Product A", "category": "Electronics", "price": 299.99, "stock": 45},
            {"id": 2, "name": "Product B", "category": "Clothing", "price": 49.99, "stock": 120},
            {"id": 3, "name": "Product C", "category": "Electronics", "price": 599.99, "stock": 15},
            {"id": 4, "name": "Product D", "category": "Home", "price": 129.99, "stock": 67},
            {"id": 5, "name": "Product E", "category": "Electronics", "price": 899.99, "stock": 8},
        ]
        
        logs.append(f"[{datetime.utcnow()}] Loaded {len(sample_data)} JSON records")
        
        # Transform: Convert to DataFrame
        df = pd.DataFrame(sample_data)
        logs.append(f"[{datetime.utcnow()}] Converted to DataFrame")
        
        # Data quality checks
        if df.isnull().any().any():
            logs.append(f"[{datetime.utcnow()}] WARNING: Found null values")
        
        # Transform: Add derived columns
        df['total_value'] = df['price'] * df['stock']
        df['price_tier'] = df['price'].apply(lambda x: 'Premium' if x > 500 else 'Standard')
        logs.append(f"[{datetime.utcnow()}] Applied transformations")
        
        # Save to processed data directory
        output_path = "data/processed_json_products.csv"
        df.to_csv(output_path, index=False)
        logs.append(f"[{datetime.utcnow()}] Saved processed data to {output_path}")
        
        # Update run status
        run.status = "success"
        run.completed_at = datetime.utcnow()
        run.records_processed = len(df)
        run.logs = "\n".join(logs)
        db.commit()
        
        return {
            "status": "success",
            "records_processed": len(df),
            "run_id": run.id
        }
        
    except Exception as e:
        logs.append(f"[{datetime.utcnow()}] ERROR: {str(e)}")
        run.status = "failed"
        run.completed_at = datetime.utcnow()
        run.error_message = str(e)
        run.logs = "\n".join(logs)
        db.commit()
        
        return {
            "status": "failed",
            "error": str(e),
            "run_id": run.id
        }
