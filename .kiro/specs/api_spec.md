# RoadSense AI — API Spec

## Base URL
`http://localhost:8000`

---

## Incidents

### POST /api/upload
Upload a pothole image with GPS coordinates for AI analysis.

**Request:** `multipart/form-data`
- `image` (file) — JPEG / PNG / WebP, max 10 MB
- `latitude` (string) — GPS latitude
- `longitude` (string) — GPS longitude

**Response:**
```json
{
  "status": "success",
  "data": {
    "incident_id": "uuid",
    "severity": "HIGH",
    "confidence": 90,
    "size_estimate": "large",
    "risk_level": "HIGH",
    "description": "Large pothole with severe surface damage",
    "has_road_damage": true,
    "vehicle_damage_cost_per_day": 8000,
    "repair_cost": 25000,
    "monthly_savings_if_fixed": 24000,
    "image_url": "https://s3.amazonaws.com/...",
    "status": "reported",
    "timestamp": "2026-03-15T12:00:00"
  }
}
```

---

### GET /api/potholes
Fetch all reported incidents.

**Response:**
```json
{
  "status": "success",
  "data": [ /* array of incident objects */ ]
}
```

---

### GET /api/potholes/{incident_id}
Fetch a single incident by ID.

**Response:** `{ "status": "success", "data": { /* incident */ } }`
**Error (404):** `{ "status": "error", "message": "Incident not found" }`

---

### PATCH /api/potholes/{incident_id}/status
Update the repair status of an incident.

**Request:**
```json
{ "status": "in_progress" }
```
Valid values: `reported` | `under_review` | `in_progress` | `fixed`

**Response:** `{ "status": "success", "data": { ... } }`

---

### POST /api/potholes/{incident_id}/upvote
Increment the community upvote counter (atomic DynamoDB update).

**Response:**
```json
{ "status": "success", "data": { "upvotes": 5 } }
```

---

## Analytics

### GET /api/stats
Aggregated incident statistics.

**Response:**
```json
{
  "status": "success",
  "data": {
    "total_incidents": 27,
    "by_severity": { "low": 0, "medium": 0, "high": 26, "critical": 1 },
    "by_status":   { "reported": 25, "resolved": 2 }
  }
}
```

---

### GET /predict/risk-zones
Top 5 high-risk wards for the next 30 days.

**Response:**
```json
{
  "status": "success",
  "data": [
    { "ward": "Whitefield",      "score": 69.0, "reason": "Whitefield: 0.0mm/h rainfall, 0 potholes reported, road age 9 yrs" },
    { "ward": "Koramangala",     "score": 64.2, "reason": "Koramangala: 0.0mm/h rainfall, 0 potholes reported, road age 8 yrs" },
    { "ward": "BTM Layout",      "score": 64.0, "reason": "BTM Layout: 0.0mm/h rainfall, 0 potholes reported, road age 9 yrs" },
    { "ward": "Electronic City", "score": 54.3, "reason": "Electronic City: 0.0mm/h rainfall, 0 potholes reported, road age 7 yrs" }
  ]
}
```

---

## Complaints

### GET /api/complaint/{incident_id}
Generate a formal BBMP RTI complaint letter for an incident.

**Response:**
```json
{
  "status": "success",
  "data": {
    "complaint": "To: Public Information Officer, BBMP\nDate: ...\nSubject: ..."
  }
}
```

---

## System

### GET /health
`{ "status": "ok", "service": "roadsense-backend" }`

### GET /
`{ "project": "RoadSense AI", "version": "1.0", "status": "running" }`
