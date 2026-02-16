from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def run_api_fetch_pipeline(session):
    """
    Pipeline 2: API Data Fetch
    Extract: Fetch data from external API
    Transform: Normalize and enrich data
    Load: Store in SQLite
    """
    from models import PipelineRun
    import httpx
    import json
    
    run = PipelineRun(
        pipeline_name="api_fetch",
        status="running",
        started_at=datetime.utcnow()
    )
    session.add(run)
    session.commit()
    
    logs = []
    
    try:
        logs.append(f"[{datetime.utcnow()}] Starting API fetch pipeline")
        
        # EXTRACT - Fetch from a public API (JSONPlaceholder for demo)
        logs.append(f"[{datetime.utcnow()}] Fetching data from external API...")
        
        # Using JSONPlaceholder as sample API
        with httpx.Client(timeout=30.0) as client:
            response = client.get("https://jsonplaceholder.typicode.com/posts")
            response.raise_for_status()
            raw_data = response.json()
        
        logs.append(f"[{datetime.utcnow()}] Extracted {len(raw_data)} records from API")
        
        # TRANSFORM - Take subset and enrich
        logs.append(f"[{datetime.utcnow()}] Transforming data...")
        
        # Limit to 20 records for demo
        records = []
        for item in raw_data[:20]:
            records.append({
                "id": item["id"],
                "user_id": item["userId"],
                "title": item["title"][:100],  # Truncate long titles
                "body": item["body"][:500],
                "category": "api_data",
                "fetched_at": datetime.utcnow().isoformat()
            })
        
        logs.append(f"[{datetime.utcnow()}] Transformed {len(records)} records")
        
        # LOAD - Save to file-based storage
        logs.append(f"[{datetime.utcnow()}] Loading data to database...")
        
        output_file = "data/api_fetched_data.json"
        
        existing = []
        if os.path.exists(output_file):
            with open(output_file, 'r') as f:
                existing = json.load(f)
        
        existing.extend(records)
        
        with open(output_file, 'w') as f:
            json.dump(existing, f, indent=2, default=str)
        
        records_processed = len(records)
        logs.append(f"[{datetime.utcnow()}] Successfully loaded {records_processed} records")
        
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
