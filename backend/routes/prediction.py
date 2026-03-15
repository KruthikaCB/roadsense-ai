"""
GET /predict/risk-zones

Returns the top 5 high-risk wards in Bengaluru predicted to develop
potholes in the next 30 days, scored using rainfall, pothole density,
traffic congestion, and road age data.
"""

import logging
from fastapi import APIRouter
from utils.response import success, error
from services.prediction_service import get_top_risk_zones

logger = logging.getLogger("roadsense.prediction")
router = APIRouter()


@router.get("/risk-zones", tags=["Analytics"])
def predict_risk_zones():
    """
    Compute and return the top 5 pothole risk zones.

    Risk score formula (all components normalized to 0–10, result scaled to 0–100):
      score = (rainfall × 0.25) + (pothole_density × 0.35)
            + (traffic_congestion × 0.25) + (road_age × 0.15)

    Each result includes:
    - ward: ward name
    - score: risk score (0–100)
    - dominant_factor: which factor contributed most
    - reason: human-readable explanation of all 4 contributing factors
    - factors: raw values for each data source
    Response also includes data_sources list.
    """
    try:
        result = get_top_risk_zones()
        zones = result["zones"]
        logger.info("Risk zones computed: %s", [z["ward"] for z in zones])
        return success(result, "Risk zones computed successfully")
    except Exception as exc:
        logger.error("Failed to compute risk zones: %s", exc)
        return error("Could not compute risk zones. Please try again.")
