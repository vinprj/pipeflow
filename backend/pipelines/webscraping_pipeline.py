"""Web Scraping Pipeline"""
import httpx
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import PipelineRun

def run_webscraping_pipeline(db: Session):
    """Scrape web data, transform, and load to database"""
    logs = []
    pipeline_name = "web_scraping"
    
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
        logs.append(f"[{datetime.utcnow()}] Starting web scraping pipeline...")
        
        # Scrape data from a public API endpoint (quotes.toscrape.com)
        url = "http://quotes.toscrape.com/"
        logs.append(f"[{datetime.utcnow()}] Fetching data from {url}")
        
        response = httpx.get(url, timeout=10.0)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract quotes
        quotes_data = []
        quotes = soup.find_all('div', class_='quote')
        
        for quote in quotes[:10]:  # Limit to first 10
            text = quote.find('span', class_='text').get_text()
            author = quote.find('small', class_='author').get_text()
            tags = [tag.get_text() for tag in quote.find_all('a', class_='tag')]
            
            quotes_data.append({
                'quote': text,
                'author': author,
                'tags': ', '.join(tags),
                'scraped_at': datetime.utcnow().isoformat()
            })
        
        logs.append(f"[{datetime.utcnow()}] Scraped {len(quotes_data)} quotes")
        
        # Transform: Convert to DataFrame
        df = pd.DataFrame(quotes_data)
        logs.append(f"[{datetime.utcnow()}] Converted to DataFrame")
        
        # Data quality: Remove duplicates
        initial_count = len(df)
        df = df.drop_duplicates(subset=['quote'])
        if len(df) < initial_count:
            logs.append(f"[{datetime.utcnow()}] Removed {initial_count - len(df)} duplicate quotes")
        
        # Save to processed data directory
        output_path = "data/processed_quotes.csv"
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
