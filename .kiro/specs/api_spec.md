# RoadSense AI — API Spec

## Base URL
`http://localhost:8000/api`

## Endpoints

### POST /upload
Upload a pothole image with GPS coordinates.

**Request:** multipart/form-data
- `image` (file) — JPEG/PNG road image
- `latitude` (float) — GPS latitude
- `longitude` (float) — GPS longitude

**Response:**
```json
{
  "status": "success",
  "data": {
    "incident_id": "uuid",
    "severity": "HIGH",
    "confidence": 90,
    "size_estimate": "large",
    "description": "Large pothole with severe surface damage",
    "vehicle_damage_cost_per_day": 8000,
    "repair_cost": 25000,
    "monthly_savings_if_fixed": 24000,
    "image_url": "https://s3.amazonaws.com/...",
    "status": "reported",
    "timestamp": "2026-03-13T12:00:00"
  }
}
```

### GET /potholes
Fetch all reported incidents.

**Response:**
```json
{
  "status": "success",
  "data": [/* array of incidents */]
}
```

### GET /stats
Get aggregated statistics.

**Response:**
```json
{
  "status": "success",
  "data": {
    "total_incidents": 10,
    "by_severity": {"low": 2, "medium": 4, "high": 3, "critical": 1},
    "by_status": {"reported": 8, "resolved": 2}
  }
}
```

### GET /complaint/{incident_id}
Generate RTI-format BBMP complaint for an incident.

**Response:**
```json
{
  "status": "success",
  "data": {
    "complaint": "To: Public Information Officer, BBMP\n..."
  }
}
```

### PATCH /potholes/{incident_id}/status
Update incident status.

**Request:**
```json
{"status": "in_progress"}
```

**Response:**
```json
{
  "status": "success",
  "data": {"incident_id": "uuid", "status": "in_progress"}
}
