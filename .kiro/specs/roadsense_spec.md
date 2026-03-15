# RoadSense AI — Project Spec

## Overview

RoadSense AI is an AI-powered pothole detection and BBMP complaint automation system for Bengaluru. Citizens upload road images, an AI vision model analyzes severity, and the system auto-generates RTI-format complaints. A live map and predictive risk model give BBMP data-driven visibility into road conditions across the city.

## Problem Statement

Bengaluru has thousands of potholes causing significant vehicle damage and accidents annually. Existing complaint systems are manual, slow, and lack data-driven prioritization. BBMP has no automated way to triage repair urgency or predict where damage will occur next.

## Current App State

The app has exactly 3 tabs:

### 1. Dashboard
- StatsPanel showing live DynamoDB counts:
  - 27 total incidents
  - 1 critical, 26 high severity
  - Worst zone: Electronic City
- RiskPredictionPanel showing top 5 high-risk wards:
  - Whitefield: 69.0
  - Koramangala: 64.2
  - BTM Layout: 64.0
  - Electronic City: 54.3

### 2. Live Map
- Leaflet map centered on Bengaluru
- Pothole markers color-coded by severity (red/orange/yellow/green)
- Status overlays: reported / under review / in progress / fixed
- Community upvote button per marker
- Live TomTom traffic incident overlay (up to 20 incidents)

### 3. Report
- Image upload with drag-and-drop
- Location search via Nominatim geocoding or GPS auto-detect
- AI analysis returns: severity, confidence, size estimate, risk level, description, economic costs
- One-click BBMP RTI complaint generation (copy / email / download)
- Saves image to AWS S3, incident record to DynamoDB

## Tech Stack

| Layer       | Technology                                         |
|-------------|----------------------------------------------------|
| Frontend    | React                                              |
| Backend     | FastAPI (Python)                                   |
| AI Analysis | OpenRouter vision model (image analysis)           |
| AI Complaints | Amazon Bedrock (complaint letter generation)     |
| Storage     | AWS S3 (images), AWS DynamoDB (incidents)          |
| Prediction  | OpenWeatherMap live rainfall + road age + density  |
| Map         | Leaflet.js + TomTom Traffic API                    |
| IDE         | Kiro with AWS Documentation MCP server             |

## User Stories

1. As a citizen, I want to upload a pothole photo so BBMP gets notified automatically
2. As a citizen, I want my location auto-detected so I don't need to enter coordinates manually
3. As a citizen, I want a one-click RTI complaint so I can formally escalate without paperwork
4. As a BBMP officer, I want to see severity-ranked potholes on a live map so I can dispatch repair crews
5. As a city planner, I want AI risk predictions per ward so I can proactively allocate resources

## AWS Services Used

- **Amazon S3** — stores pothole images uploaded by citizens
- **Amazon DynamoDB** — stores incident records with AI metadata and status
- **Amazon Bedrock** — generates RTI complaint letters
- **OpenRouter AI** — vision model for image severity analysis

## Success Metrics

- Upload to AI result in under 10 seconds
- Complaint generated in under 5 seconds
- Map loads all incidents in under 3 seconds
- Risk prediction scores update with live rainfall data
