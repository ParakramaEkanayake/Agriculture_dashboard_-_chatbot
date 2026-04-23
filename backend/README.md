# AgriAnalytics – Flask Backend

## Setup & Run

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/data` | Paginated dataset (filters: soil, crop, fertilizer) |
| GET | `/api/stats` | Descriptive statistics for all numeric columns |
| GET | `/api/kpis` | Key performance indicators |
| GET | `/api/filters` | Available filter options |
| GET | `/api/distribution/<column>` | Histogram data for any numeric column |
| GET | `/api/soil-distribution` | Soil type counts |
| GET | `/api/crop-distribution` | Crop type counts |
| GET | `/api/fertilizer-distribution` | Fertilizer usage counts |
| GET | `/api/nutrients-by-soil` | Avg NPK+Carbon by soil type |
| GET | `/api/nutrients-by-crop` | Avg NPK+Carbon by crop type |
| GET | `/api/scatter` | Scatter data for any two numeric columns |
| GET | `/api/correlation` | Full correlation matrix |
| GET | `/api/ph-analysis` | pH category distribution |
| GET | `/api/temp-moisture-trend` | Temperature vs moisture trend |
| GET | `/api/rainfall-nitrogen` | Rainfall vs nitrogen by crop |
| POST | `/api/chat` | AI chatbot (body: `{"message": "..."}`) |

## Dataset

Synthetic agricultural dataset with 500 records and 11 variables:
- **Numeric**: Temperature, Moisture, Rainfall, PH, Nitrogen, Phosphorus, Potassium, Carbon
- **Categorical**: Soil Type, Crop Type, Fertilizer
