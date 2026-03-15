# RoadSense AI — Architecture Spec

## System Architecture

### Frontend (React)
Three tabs, no routing library — tab state managed in `Home.js`:

- **Dashboard** — `StatsPanel` + `RiskPredictionPanel`
- **Live Map** — `MapDashboard` (Leaflet + TomTom traffic overlay)
- **Report** — `UploadForm` (image upload, location, AI result, complaint)

### Backend (FastAPI + Python)

| Route                                  | Purpose                                              |
|----------------------------------------|------------------------------------------------------|
| `POST /api/upload`                     | Receive image, run AI analysis, save to S3 + DynamoDB |
| `GET  /api/potholes`                   | Fetch all incidents from DynamoDB                    |
| `GET  /api/potholes/{id}`              | Fetch single incident                                |
| `PATCH /api/potholes/{id}/status`      | Update repair status                                 |
| `POST /api/potholes/{id}/upvote`       | Increment community upvote counter                   |
| `GET  /api/stats`                      | Aggregate severity and status counts                 |
| `GET  /api/complaint/{id}`             | Generate RTI complaint via Bedrock AI                |
| `GET  /predict/risk-zones`             | Return top 5 risk wards (prediction model)           |
| `GET  /health`                         | Service health check                                 |

### Upload Flow
```
Citizen uploads image + GPS
        ↓
FastAPI validates file type + size
        ↓
OpenRouter vision model analyzes image
  → severity, confidence, size, description, economic costs
        ↓
AWS S3 stores image → returns URL
        ↓
AWS DynamoDB stores incident record
        ↓
Frontend displays AI result card
        ↓
Citizen clicks "Generate Complaint"
        ↓
Nominatim reverse-geocodes GPS → street name
        ↓
Amazon Bedrock generates RTI letter
        ↓
DynamoDB marks complaint_sent = true
```

### Risk Prediction Flow
```
GET /predict/risk-zones
        ↓
OpenWeatherMap API → live rainfall mm/h for Bengaluru
        ↓
DynamoDB scan → pothole count per ward
        ↓
Scoring formula per ward:
  raw = (base_risk×0.5) + (road_age×0.3) + (pothole_density×0.15) + (rainfall×0.05)
  score = raw × 10  →  0–100
        ↓
Top 5 wards sorted by descending score
        ↓
RiskPredictionPanel renders colored cards
```

## Data Model (DynamoDB — `roadsense-incidents`)

```json
{
  "incident_id":                "uuid",
  "timestamp":                  "ISO8601",
  "latitude":                   "string",
  "longitude":                  "string",
  "severity":                   "LOW | MEDIUM | HIGH | CRITICAL",
  "image_url":                  "s3_url",
  "status":                     "reported | under_review | in_progress | fixed",
  "confidence":                 "number",
  "size_estimate":              "string",
  "description":                "string",
  "risk_level":                 "string",
  "vehicle_damage_cost_per_day": "number",
  "repair_cost":                "number",
  "monthly_savings_if_fixed":   "number",
  "upvotes":                    "number",
  "complaint_sent":             "boolean"
}
```

## Security
- AWS credentials stored in `.env` (gitignored)
- CORS open for local development — restrict in production
- File type and size validated before AI processing
