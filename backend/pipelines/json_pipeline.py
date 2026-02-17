import json
import os
from datetime import datetime
from sqlalchemy.orm import Session
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import PipelineRun

def run_json_ingestion_pipeline(db: Session):
    """Process JSON files and load into database"""
    run = PipelineRun(
        pipeline_name="json_ingestion",
        status="running",
        started_at=datetime.now(),
        records_processed=0
    )
    db.add(run)
    db.commit()
    
    logs = []
    logs.append(f"[{datetime.now()}] Starting JSON ingestion pipeline")
    
    try:
        # Sample JSON data directory
        json_dir = os.path.join(os.path.dirname(__file__), '../../data')
        os.makedirs(json_dir, exist_ok=True)
        
        # Create sample JSON file if it doesn't exist
        sample_file = os.path.join(json_dir, 'sample_data.json')
        if not os.path.exists(sample_file):
            sample_data = {
                "users": [
                    {"id": 1, "name": "Alice Johnson", "email": "alice@example.com", "role": "admin"},
                    {"id": 2, "name": "Bob Smith", "email": "bob@example.com", "role": "user"},
                    {"id": 3, "name": "Carol White", "email": "carol@example.com", "role": "user"},
                    {"id": 4, "name": "David Brown", "email": "david@example.com", "role": "moderator"},
                    {"id": 5, "name": "Eve Davis", "email": "eve@example.com", "role": "user"}
                ]
            }
            with open(sample_file, 'w') as f:
                json.dump(sample_data, f, indent=2)
            logs.append(f"[{datetime.now()}] Created sample JSON file")
        
        # Read and process JSON
        logs.append(f"[{datetime.now()}] Reading JSON file: {sample_file}")
        with open(sample_file, 'r') as f:
            data = json.load(f)
        
        logs.append(f"[{datetime.now()}] Found {len(data['users'])} user records")
        
        # Transform and validate data
        processed_records = 0
        for user in data['users']:
            # Simulate processing/validation
            if 'email' in user and '@' in user['email']:
                processed_records += 1
                logs.append(f"[{datetime.now()}] Processed user: {user['name']} ({user['email']})")
        
        # Update run status
        run.status = "success"
        run.completed_at = datetime.now()
        run.records_processed = processed_records
        run.logs = "\n".join(logs)
        
        logs.append(f"[{datetime.now()}] Successfully processed {processed_records} JSON records")
        logs.append(f"[{datetime.now()}] Pipeline completed successfully")
        
    except Exception as e:
        run.status = "failed"
        run.completed_at = datetime.now()
        run.error_message = str(e)
        logs.append(f"[{datetime.now()}] ERROR: {str(e)}")
        run.logs = "\n".join(logs)
    
    db.commit()
    
    return {
        "status": run.status,
        "records_processed": run.records_processed,
        "run_id": run.id
    }
