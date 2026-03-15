# Tasks — Risk Prediction Feature

## Task Overview

Most of the risk prediction pipeline is already implemented. These tasks cover verification of existing behavior, fixing known gaps, and ensuring the full stack works end-to-end.

---

- [x] 1. Verify Prediction_Service scoring formula

  Confirm `prediction_service.py` implements the correct formula and weights.

  - [x] 1.1 Formula matches: `raw = (base_risk×0.5) + (road_age×0.3) + (pothole_norm×0.15) + (rainfall_norm×0.05)`
  - [x] 1.2 Normalization ceilings: rainfall=50, potholes=20, road_age=9
  - [x] 1.3 Output scaled to 0–100 via `round(raw × 10, 1)`
  - [x] 1.4 BASE_RISK and ROAD_AGE values match the requirements table

- [x] 2. Verify OpenWeatherMap rainfall fetch

  Confirm live rainfall is fetched and gracefully falls back to 0 on failure.

  - [x] 2.1 `OPENWEATHER_API_KEY` read from environment variable
  - [x] 2.2 Reads `rain.1h` field, defaults to 0 if absent
  - [x] 2.3 On API failure, logs warning and continues with rainfall=0

- [x] 3. Verify DynamoDB pothole density count

  Confirm incident counts per ward are pulled from live DynamoDB data.

  - [x] 3.1 Scans `roadsense-incidents` table via `get_all_incidents()`
  - [x] 3.2 Case-insensitive substring match across `location`, `ward`, `description` fields
  - [x] 3.3 Wards with no matches default to count=0

- [x] 4. Verify `/predict/risk-zones` endpoint

  Confirm the FastAPI route is registered and returns the correct response shape.

  - [x] 4.1 Route registered in `app.py` with prefix `/predict`
  - [x] 4.2 Returns `{ status, message, data, timestamp }` on success
  - [x] 4.3 Returns `{ status: "error", message }` on exception
  - [x] 4.4 Each item in `data` contains `ward`, `score`, `reason`

- [ ] 5. Verify RiskPredictionPanel frontend behavior

  Confirm the React component fetches, renders, and handles errors correctly.

  - [ ] 5.1 Fetches from `http://localhost:8000/predict/risk-zones` on mount
  - [ ] 5.2 Renders a card per ward with name, score, reason, and progress bar
  - [ ] 5.3 Bar color: score>70 → red, 40–70 → orange, <40 → green
  - [ ] 5.4 Heading reads "AI Pothole Prediction — Next 30 Days"
  - [ ] 5.5 Shows loading state while fetching
  - [ ] 5.6 Shows error message if fetch fails, does not crash

- [ ] 6. Verify Dashboard tab layout

  Confirm RiskPredictionPanel appears below StatsPanel in the Dashboard tab.

  - [ ] 6.1 `Home.js` renders `<StatsPanel />` then `<RiskPredictionPanel />` in the dashboard tab
  - [ ] 6.2 Both panels visible without horizontal scroll on standard desktop viewport

- [ ] 7. End-to-end smoke test

  Run the full stack and confirm risk scores appear in the UI.

  - [ ] 7.1 Start backend: `uvicorn app:app --reload` in `/backend`
  - [ ] 7.2 Start frontend: `npm start` in `/frontend`
  - [ ] 7.3 Open Dashboard tab — StatsPanel loads with incident counts
  - [ ] 7.4 RiskPredictionPanel shows top 5 wards with scores and colored bars
  - [ ] 7.5 Scores are in the expected range (Whitefield ~69, Koramangala ~64)
