import os
import requests
from services.dynamo_service import get_all_incidents

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY", os.getenv("REACT_APP_TOMTOM_KEY", ""))
BENGALURU_CITY_ID = "1277333"

# Road age per ward (years)
ROAD_AGE = {
    "Koramangala":    8,
    "Whitefield":     9,
    "Electronic City": 7,
    "BTM Layout":     9,
}

# Representative lat/lng per ward for TomTom traffic flow queries
TRAFFIC_COORDS = {
    "Koramangala":    (12.9352, 77.6245),
    "Whitefield":     (12.9698, 77.7499),
    "Electronic City": (12.8399, 77.6770),
    "BTM Layout":     (12.9166, 77.6101),
}

MAX_RAINFALL   = 50.0   # mm/h
MAX_POTHOLES   = 20.0   # count
MAX_TRAFFIC    = 10.0   # congestion index 0–10
MAX_ROAD_AGE   = 9.0    # years

DATA_SOURCES = [
    "OpenWeatherMap",
    "DynamoDB Historical",
    "TomTom Traffic",
    "BBMP Road Age Data",
]


def _fetch_rainfall_mm() -> float:
    """Fetch current Bengaluru rainfall in mm/h from OpenWeatherMap."""
    try:
        url = (
            f"https://api.openweathermap.org/data/2.5/weather"
            f"?id={BENGALURU_CITY_ID}&appid={OPENWEATHER_API_KEY}&units=metric"
        )
        resp = requests.get(url, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return float(data.get("rain", {}).get("1h", 0))
    except Exception:
        return 0.0


def _fetch_traffic_congestion(lat: float, lon: float) -> float:
    """
    Fetch TomTom traffic flow for a coordinate and return a congestion index 0–10.
    currentSpeed / freeFlowSpeed gives a ratio; lower ratio = more congestion.
    Congestion index = (1 - ratio) * 10, clamped to 0–10.
    Falls back to 5.0 if API key is missing or request fails.
    """
    if not TOMTOM_API_KEY:
        return 5.0
    try:
        url = (
            f"https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
            f"?point={lat},{lon}&key={TOMTOM_API_KEY}"
        )
        resp = requests.get(url, timeout=5)
        resp.raise_for_status()
        data = resp.json().get("flowSegmentData", {})
        current = float(data.get("currentSpeed", 0))
        free_flow = float(data.get("freeFlowSpeed", 1))
        if free_flow <= 0:
            return 5.0
        ratio = min(current / free_flow, 1.0)
        return round((1.0 - ratio) * 10.0, 2)
    except Exception:
        return 5.0


def _count_potholes_per_ward(incidents: list) -> dict:
    """Count incidents per ward using case-insensitive substring match."""
    counts = {ward: 0 for ward in ROAD_AGE}
    for incident in incidents:
        text = " ".join([
            str(incident.get("location", "")),
            str(incident.get("ward", "")),
            str(incident.get("description", "")),
        ]).lower()
        for ward in ROAD_AGE:
            if ward.lower() in text:
                counts[ward] += 1
    return counts


def _normalize(value: float, max_val: float) -> float:
    """Clamp and normalize value to 0–10 scale."""
    return min(value / max_val, 1.0) * 10.0


def _dominant_factor(r_norm: float, p_norm: float, t_norm: float, a_norm: float) -> str:
    """Return the label of the factor with the highest weighted contribution."""
    weighted = {
        "Rainfall":        r_norm * 0.25,
        "Pothole Density": p_norm * 0.35,
        "Traffic":         t_norm * 0.25,
        "Road Age":        a_norm * 0.15,
    }
    return max(weighted, key=weighted.get)


def _build_reason(
    ward: str,
    rainfall: float,
    pothole_count: int,
    traffic: float,
    road_age: int,
    dominant: str,
) -> str:
    parts = [
        f"{rainfall:.1f}mm/h rainfall",
        f"{pothole_count} potholes reported",
        f"traffic congestion {traffic:.1f}/10",
        f"road age {road_age} yrs",
    ]
    return f"{ward} [{dominant} dominant]: " + ", ".join(parts)


def get_top_risk_zones() -> dict:
    """
    Compute risk scores for all wards using 4 data sources.

    Formula (components normalized to 0–10, result scaled to 0–100):
      score = (rainfall_norm * 0.25) + (pothole_norm * 0.35)
            + (traffic_norm * 0.25) + (road_age_norm * 0.15)

    Returns a dict with 'zones' (top 5) and 'data_sources'.
    """
    rainfall_mm = _fetch_rainfall_mm()
    incidents = get_all_incidents()
    pothole_counts = _count_potholes_per_ward(incidents)

    results = []
    for ward, age in ROAD_AGE.items():
        lat, lon = TRAFFIC_COORDS[ward]
        traffic_idx = _fetch_traffic_congestion(lat, lon)

        r_norm = _normalize(rainfall_mm, MAX_RAINFALL)
        p_norm = _normalize(pothole_counts[ward], MAX_POTHOLES)
        t_norm = _normalize(traffic_idx, MAX_TRAFFIC)
        a_norm = _normalize(age, MAX_ROAD_AGE)

        raw = (r_norm * 0.25) + (p_norm * 0.35) + (t_norm * 0.25) + (a_norm * 0.15)
        score = round(raw * 10, 1)  # 0–10 → 0–100

        dominant = _dominant_factor(r_norm, p_norm, t_norm, a_norm)

        results.append({
            "ward": ward,
            "score": score,
            "dominant_factor": dominant,
            "reason": _build_reason(ward, rainfall_mm, pothole_counts[ward], traffic_idx, age, dominant),
            "factors": {
                "rainfall_mm": round(rainfall_mm, 2),
                "pothole_count": pothole_counts[ward],
                "traffic_congestion": traffic_idx,
                "road_age_years": age,
            },
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return {
        "zones": results[:5],
        "data_sources": DATA_SOURCES,
    }
