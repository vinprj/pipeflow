# PipeFlow - ETL Pipeline Dashboard

A simple but impressive data engineering portfolio project demonstrating ETL pipeline orchestration with a modern web dashboard.

## Features

- **3 ETL Pipelines**:
  - CSV Ingestion: Extract data from CSV files, clean/transform, load to database
  - API Data Fetch: Fetch data from external APIs, normalize, store in database  
  - Data Aggregation: Read from existing data, compute metrics, store results
- **Real-time Dashboard**: Monitor pipeline runs, status, logs, and statistics
- **SQLite Storage**: Simple file-based database for pipeline runs and processed data

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, Pandas
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Database**: SQLite
- **External APIs**: JSONPlaceholder (for demo)

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  CSV Files /    │     │   FastAPI       │     │   SQLite        │
│  External APIs  │────▶│   Backend       │────▶│   Database      │
└─────────────────┘     │   (ETL Logic)   │     └─────────────────┘
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   React         │
                       │   Dashboard     │
                       └─────────────────┘
```

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Create data directory
mkdir -p data

# Run the API server
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install

# Run development server
npm run dev
```

The dashboard will be available at `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pipelines` | Get all pipeline runs |
| GET | `/api/pipelines/{name}` | Get runs for specific pipeline |
| POST | `/api/pipelines/csv-ingestion/trigger` | Trigger CSV ingestion |
| POST | `/api/pipelines/api-fetch/trigger` | Trigger API fetch |
| POST | `/api/pipelines/aggregation/trigger` | Trigger data aggregation |
| GET | `/api/pipelines/{id}/logs` | Get logs for a run |
| GET | `/api/stats` | Get dashboard statistics |

## Project Structure

```
pipeflow/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── models.py            # SQLAlchemy models
│   ├── requirements.txt     # Python dependencies
│   ├── pipelines/
│   │   ├── csv_pipeline.py
│   │   ├── api_pipeline.py
│   │   └── aggregation_pipeline.py
│   └── data/                # SQLite DB and processed data
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
├── data/
│   └── sample_sales.csv     # Sample data for CSV pipeline
└── README.md
```

## Sample Data

The project includes a sample sales CSV (`data/sample_sales.csv`) with 20 records containing:
- date
- product
- quantity
- price

## Running Pipelines

1. Start both backend and frontend servers
2. Click "Run Pipeline" on any pipeline card
3. Watch the status update in real-time
4. View detailed logs by clicking "View" on any run

## License

MIT
