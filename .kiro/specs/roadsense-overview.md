# RoadSense AI — Project Overview

## Problem

Bengaluru has one of the worst pothole crises in India. Thousands of potholes go unreported or unrepaired for months, causing vehicle damage, accidents, and economic loss. The existing BBMP reporting process is manual, slow, and lacks data visibility — citizens have no easy way to report issues, and the municipality has no real-time picture of road conditions across the city.

## Solution

RoadSense AI is an end-to-end pothole detection and reporting platform. Citizens upload a photo of a damaged road from their phone. The system uses AI vision to instantly analyze severity, estimate repair costs, and generate a formal BBMP RTI complaint — all automatically. The data feeds a live map and a predictive risk model that helps the municipality prioritize repairs before conditions worsen.

## Tech Stack

| Layer       | Technology                                      |
|-------------|-------------------------------------------------|
| Frontend    | React, Leaflet.js, TomTom Traffic API           |
| Backend     | FastAPI (Python)                                |
| AI Analysis | OpenRouter AI (vision model via Bedrock)        |
| Storage     | AWS S3 (images), AWS DynamoDB (incident records)|
| Prediction  | OpenWeatherMap API + custom risk scoring model  |
| Deployment  | AWS (backend), local dev via uvicorn            |

## Features Built

### Image Upload & AI Analysis
- Citizens upload a pothole photo with GPS coordinates
- AI vision model classifies severity (Low / Medium / High / Critical)
- Returns confidence score, size estimate, risk level, and description
- Estimates vehicle damage cost per day and repair ROI

### Automated BBMP Complaint Generation
- One-click RTI complaint letter generated via AI
- Reverse-geocodes GPS to street name using Nominatim
- Complaint can be copied, emailed to BBMP, or downloaded as a text file

### Live Incident Map
- Leaflet map showing all reported potholes color-coded by severity
- Status overlays: reported / under review / in progress / fixed
- Community upvoting to surface high-priority incidents
- Live TomTom traffic incident overlay

### AI Risk Prediction
- Predicts top 5 high-risk wards for the next 30 days
- Scoring model combines: infrastructure baseline, road age, pothole density, live rainfall
- Helps BBMP allocate repair crews proactively

### Dashboard & Stats
- Real-time stats: total incidents, severity breakdown, complaints sent, worst zone
- Clean dark-mode UI with shimmer loading states

## Impact

- Faster BBMP response through automated, structured complaint generation
- Data-driven repair prioritization using AI risk scores instead of ad-hoc decisions
- Community-driven validation via upvotes surfaces the most dangerous potholes
- Economic visibility — every report shows the daily cost of inaction to decision makers
- Scalable foundation — the same pipeline can extend to any Indian city with minimal changes
