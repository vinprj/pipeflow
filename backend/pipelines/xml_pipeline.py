import os
import xml.etree.ElementTree as ET
from datetime import datetime
from sqlalchemy.orm import Session
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import PipelineRun

def run_xml_parser_pipeline(db: Session):
    """Parse XML documents and extract structured data"""
    run = PipelineRun(
        pipeline_name="xml_parser",
        status="running",
        started_at=datetime.now(),
        records_processed=0
    )
    db.add(run)
    db.commit()
    
    logs = []
    logs.append(f"[{datetime.now()}] Starting XML parser pipeline")
    
    try:
        # Sample XML data directory
        xml_dir = os.path.join(os.path.dirname(__file__), '../../data')
        os.makedirs(xml_dir, exist_ok=True)
        
        # Create sample XML file if it doesn't exist
        sample_file = os.path.join(xml_dir, 'sample_catalog.xml')
        if not os.path.exists(sample_file):
            sample_xml = '''<?xml version="1.0" encoding="UTF-8"?>
<catalog>
    <product id="1">
        <name>Laptop Pro</name>
        <category>Electronics</category>
        <price>1299.99</price>
        <stock>45</stock>
    </product>
    <product id="2">
        <name>Wireless Mouse</name>
        <category>Accessories</category>
        <price>29.99</price>
        <stock>120</stock>
    </product>
    <product id="3">
        <name>USB-C Cable</name>
        <category>Accessories</category>
        <price>14.99</price>
        <stock>200</stock>
    </product>
    <product id="4">
        <name>Monitor 27"</name>
        <category>Electronics</category>
        <price>449.99</price>
        <stock>30</stock>
    </product>
    <product id="5">
        <name>Keyboard Mechanical</name>
        <category>Accessories</category>
        <price>89.99</price>
        <stock>75</stock>
    </product>
</catalog>'''
            with open(sample_file, 'w') as f:
                f.write(sample_xml)
            logs.append(f"[{datetime.now()}] Created sample XML file")
        
        # Parse XML
        logs.append(f"[{datetime.now()}] Parsing XML file: {sample_file}")
        tree = ET.parse(sample_file)
        root = tree.getroot()
        
        # Extract products
        products = root.findall('product')
        logs.append(f"[{datetime.now()}] Found {len(products)} product records")
        
        # Process each product
        processed_records = 0
        for product in products:
            product_id = product.get('id')
            name = product.find('name').text
            category = product.find('category').text
            price = float(product.find('price').text)
            stock = int(product.find('stock').text)
            
            # Simulate validation and processing
            if price > 0 and stock >= 0:
                processed_records += 1
                logs.append(f"[{datetime.now()}] Processed: {name} (${price}) - Stock: {stock}")
        
        # Update run status
        run.status = "success"
        run.completed_at = datetime.now()
        run.records_processed = processed_records
        run.logs = "\n".join(logs)
        
        logs.append(f"[{datetime.now()}] Successfully processed {processed_records} XML records")
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
