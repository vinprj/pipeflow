from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def run_aggregation_pipeline(session):
    """
    Pipeline 3: Data Aggregation
    Extract: Read from existing data files
    Transform: Aggregate and compute metrics
    Load: Store aggregated results
    """
    from models import PipelineRun
    import json
    
    run = PipelineRun(
        pipeline_name="data_aggregation",
        status="running",
        started_at=datetime.utcnow()
    )
    session.add(run)
    session.commit()
    
    logs = []
    
    try:
        logs.append(f"[{datetime.utcnow()}] Starting data aggregation pipeline")
        
        # EXTRACT - Read from both data sources
        logs.append(f"[{datetime.utcnow()}] Reading source data...")
        
        sales_file = "data/processed_sales.json"
        api_file = "data/api_fetched_data.json"
        
        sales_data = []
        api_data = []
        
        if os.path.exists(sales_file):
            with open(sales_file, 'r') as f:
                sales_data = json.load(f)
        
        if os.path.exists(api_file):
            with open(api_file, 'r') as f:
                api_data = json.load(f)
        
        logs.append(f"[{datetime.utcnow()}] Found {len(sales_data)} sales records, {len(api_data)} API records")
        
        # TRANSFORM - Compute aggregations
        logs.append(f"[{datetime.utcnow()}] Computing aggregations...")
        
        aggregations = {
            "generated_at": datetime.utcnow().isoformat(),
            "source_records": {
                "sales": len(sales_data),
                "api": len(api_data)
            },
            "metrics": {}
        }
        
        # Sales aggregations
        if sales_data:
            total_revenue = sum(record.get('total', 0) for record in sales_data if isinstance(record, dict))
            total_quantity = sum(record.get('quantity', 0) for record in sales_data if isinstance(record, dict))
            
            # Group by product
            product_totals = {}
            for record in sales_data:
                if isinstance(record, dict):
                    product = record.get('product', 'Unknown')
                    product_totals[product] = product_totals.get(product, 0) + record.get('total', 0)
            
            aggregations["metrics"]["sales"] = {
                "total_revenue": round(total_revenue, 2),
                "total_quantity_sold": total_quantity,
                "avg_order_value": round(total_revenue / len(sales_data), 2) if sales_data else 0,
                "top_products": dict(sorted(product_totals.items(), key=lambda x: x[1], reverse=True)[:5])
            }
        
        # API data aggregations
        if api_data:
            user_counts = {}
            for record in api_data:
                if isinstance(record, dict):
                    user_id = record.get('user_id', 'Unknown')
                    user_counts[user_id] = user_counts.get(user_id, 0) + 1
            
            aggregations["metrics"]["api"] = {
                "total_posts": len(api_data),
                "unique_users": len(user_counts),
                "posts_per_user": round(len(api_data) / len(user_counts), 2) if user_counts else 0
            }
        
        logs.append(f"[{datetime.utcnow()}] Aggregation complete")
        
        # LOAD - Save aggregated results
        logs.append(f"[{datetime.utcnow()}] Saving aggregated results...")
        
        output_file = "data/aggregated_metrics.json"
        
        with open(output_file, 'w') as f:
            json.dump(aggregations, f, indent=2, default=str)
        
        records_processed = len(sales_data) + len(api_data)
        logs.append(f"[{datetime.utcnow()}] Aggregated {records_processed} total records")
        
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
