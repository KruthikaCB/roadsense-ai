# RoadSense AI — Architecture Spec

## System Architecture

### Frontend (React)
- Upload Form — image + location search with Nominatim geocoding
- Live Map — Leaflet + TomTom traffic overlay
- Stats Panel — real-time DynamoDB stats
- Leaderboard — worst zones by severity + traffic impact
- Priority List — BBMP repair priority scoring
- ROI Calculator — economic loss vs repair cost
- Demo Mode — auto-play pipeline for presentations

### Backend (FastAPI + Python)
- `/api/upload` — receives image, runs Bedrock Vision, saves to S3 + DynamoDB
- `/api/potholes` — fetches all incidents from DynamoDB
- `/api/stats` — aggregates severity/status counts
- `/api/complaint/{id}` — generates RTI complaint via Bedrock

### AWS Services Flow
```
User uploads image
    ↓
FastAPI backend receives file
    ↓
Amazon Bedrock (Claude 3 Haiku) analyzes image
    → Returns: severity, confidence, size, description, economic impact
    ↓
Amazon S3 stores image
    → Returns: public image URL
    ↓
Amazon DynamoDB stores incident record
    → incident_id, lat, lng, severity, image_url, ai_result, timestamp
    ↓
Frontend displays result + map pin
    ↓
User clicks "Generate Complaint"
    ↓
Amazon Bedrock generates RTI format letter
    ↓
Complaint displayed + marked as sent
```

## Data Model (DynamoDB)
```json
{
  "incident_id": "uuid",
  "timestamp": "ISO8601",
  "latitude": "string",
  "longitude": "string",
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "image_url": "s3_url",
  "status": "reported|under_review|in_progress|fixed",
  "confidence": "number",
  "size_estimate": "string",
  "description": "string",
  "vehicle_damage_cost_per_day": "number",
  "repair_cost": "number",
  "monthly_savings_if_fixed": "number",
  "complaint_sent": "boolean"
}
```

## Security
- AWS credentials stored in .env (not committed to git)
- CORS enabled for local development
- Input validation on file type and size