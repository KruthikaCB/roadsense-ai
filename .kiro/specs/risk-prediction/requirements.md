# Requirements Document — Risk Prediction Feature

## Introduction

The Risk Prediction feature for RoadSense AI provides a data-driven forecast of the top 5 highest-risk wards in Bengaluru for pothole formation over the next 30 days. It combines live rainfall data from OpenWeatherMap, pothole incident density from DynamoDB, a hardcoded infrastructure baseline (BASE_RISK), and road age per ward to compute a composite risk score. Results are displayed in the Dashboard tab inside the `RiskPredictionPanel` React component.

Current live scores (as of latest run):
- Whitefield: 69.0
- Koramangala: 64.2
- BTM Layout: 64.0
- Electronic City: 54.3

## Glossary

- **Prediction_Service**: `backend/services/prediction_service.py` — computes ward-level risk scores
- **Risk_Score**: Composite numeric value (0–100) derived from base risk, road age, pothole density, and rainfall
- **Ward**: Named administrative zone in Bengaluru (Koramangala, Whitefield, Electronic City, BTM Layout)
- **BASE_RISK**: Hardcoded infrastructure baseline (0–10) per ward reflecting historical damage, drainage quality, and traffic load
- **Rainfall**: Live precipitation in mm/h from OpenWeatherMap API for Bengaluru (city ID 1277333)
- **Pothole_Density**: Count of DynamoDB incidents whose description/ward field matches a ward name
- **Road_Age**: Hardcoded integer (years) per ward
- **RiskPredictionPanel**: React component in `frontend/src/components/RiskPredictionPanel.js`
- **Prediction_Router**: FastAPI router at `backend/routes/prediction.py`, prefix `/predict`

## Requirements

### Requirement 1: Fetch Live Rainfall Data

**User Story:** As a city planner, I want live rainfall data in the risk score so conditions reflect current weather.

#### Acceptance Criteria

1. WHEN the Prediction_Service is invoked, it SHALL fetch current Bengaluru rainfall from OpenWeatherMap using the `OPENWEATHER_API_KEY` environment variable
2. IF the API call fails, THEN the Prediction_Service SHALL use rainfall = 0 and continue
3. The Prediction_Service SHALL read precipitation from `rain.1h`, defaulting to 0 if absent

### Requirement 2: Fetch Pothole Density Per Ward

**User Story:** As a city planner, I want live incident counts per ward so scores reflect actual reported data.

#### Acceptance Criteria

1. WHEN invoked, the Prediction_Service SHALL scan DynamoDB table `roadsense-incidents` for all incidents
2. It SHALL count incidents whose `location`, `ward`, or `description` field contains the ward name (case-insensitive)
3. IF a ward has no matching incidents, it SHALL use a count of 0

### Requirement 3: Apply Road Age and BASE_RISK Per Ward

**User Story:** As a city planner, I want infrastructure quality factored in so older, worse-maintained roads score higher.

#### Acceptance Criteria

1. The Prediction_Service SHALL use these hardcoded values:

   | Ward             | Road Age (yrs) | BASE_RISK (0–10) |
   |------------------|----------------|------------------|
   | Koramangala      | 8              | 7.5              |
   | Whitefield       | 9              | 7.8              |
   | Electronic City  | 7              | 6.2              |
   | BTM Layout       | 9              | 6.8              |

2. All inputs SHALL be normalized to 0–10 before scoring

### Requirement 4: Compute Risk Score

**User Story:** As a city planner, I want a single composite score per ward for easy comparison.

#### Acceptance Criteria

1. The Prediction_Service SHALL compute scores using:
   ```
   raw = (base_risk × 0.5) + (road_age_norm × 0.3) + (pothole_norm × 0.15) + (rainfall_norm × 0.05)
   score = round(raw × 10, 1)   # scales 0–10 → 0–100
   ```
2. Normalization ceilings: rainfall = 50 mm/h, potholes = 20, road age = 9 years
3. The service SHALL return the top 5 wards sorted by descending score
4. Each result SHALL include a human-readable `reason` string listing contributing factors

### Requirement 5: Expose Risk Zones Endpoint

**User Story:** As a frontend developer, I want a REST endpoint so the UI can fetch predictions independently.

#### Acceptance Criteria

1. The Prediction_Router SHALL expose `GET /predict/risk-zones`
2. On success, it SHALL return `{ status: "success", data: [ ...top5 ] }`
3. On failure, it SHALL return `{ status: "error", message: "..." }`
4. Each item in `data` SHALL contain: `ward` (string), `score` (number 0–100), `reason` (string)

### Requirement 6: Display Risk Prediction Panel

**User Story:** As a BBMP officer, I want to see the top 5 risky wards on the Dashboard so I can allocate repair crews proactively.

#### Acceptance Criteria

1. The RiskPredictionPanel SHALL fetch from `http://localhost:8000/predict/risk-zones` on mount
2. It SHALL render each ward as a card with: ward name, score, reason text, and a colored progress bar
3. Score > 70 → red bar (`#ef4444`)
4. Score 40–70 → orange bar (`#f97316`)
5. Score < 40 → green bar (`#22c55e`)
6. Heading SHALL read "AI Pothole Prediction — Next 30 Days"
7. The panel SHALL appear in the Dashboard tab below the StatsPanel
8. IF the fetch fails, it SHALL show an error message without crashing

### Requirement 7: Register Prediction Router

**User Story:** As a backend developer, I want the router registered so the endpoint is reachable on app start.

#### Acceptance Criteria

1. `app.py` SHALL import and register the Prediction_Router with prefix `/predict`
2. The endpoint SHALL be reachable at `GET /predict/risk-zones` when the FastAPI app is running
