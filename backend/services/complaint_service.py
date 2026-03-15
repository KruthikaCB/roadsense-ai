"""
Smart batch complaint service.

Groups potholes by zone (reverse-geocoded ward/suburb), generates one
summary email per zone, and marks incidents as complaint_sent.
"""

import json
import logging
import math
import urllib.request
from datetime import datetime, timezone
from services.dynamo_service import get_all_incidents, table

logger = logging.getLogger("roadsense.complaint_service")

DAILY_LOSS = {"critical": 1667, "high": 667, "medium": 267, "low": 67}
SIX_HOURS_SECONDS = 6 * 3600


def _haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371000
    to_rad = math.radians
    dlat = to_rad(lat2 - lat1)
    dlon = to_rad(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(to_rad(lat1)) * math.cos(to_rad(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _reverse_geocode_zone(lat: float, lon: float) -> str:
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
        req = urllib.request.Request(url, headers={"User-Agent": "RoadSenseAI/1.0"})
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode())
            addr = data.get("address", {})
            zone = (
                addr.get("suburb") or addr.get("neighbourhood") or
                addr.get("city_district") or addr.get("county") or
                addr.get("city") or "Bengaluru"
            )
            return zone
    except Exception as exc:
        logger.warning("Reverse geocode failed (%s, %s): %s", lat, lon, exc)
        return "Bengaluru"


def _needs_batch(incident: dict) -> bool:
    """Return True if this incident should be included in the next batch."""
    if not incident.get("complaint_sent", False):
        return True
    last_sent = incident.get("last_complaint_sent")
    if not last_sent:
        return True
    try:
        sent_dt = datetime.fromisoformat(last_sent.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        elapsed = (now - sent_dt).total_seconds()
        report_count = int(incident.get("report_count", 1))
        return elapsed >= SIX_HOURS_SECONDS and report_count > 1
    except Exception:
        return False


def _mark_sent(incident_id: str):
    now = datetime.utcnow().isoformat()
    table.update_item(
        Key={"incident_id": incident_id},
        UpdateExpression="SET complaint_sent = :t, last_complaint_sent = :ts",
        ExpressionAttributeValues={":t": True, ":ts": now},
    )


def _build_zone_email(zone: str, incidents: list) -> str:
    total_loss = sum(DAILY_LOSS.get(p.get("severity", "").lower(), 0) for p in incidents)
    lines = [
        f"Dear BBMP Ward Officer,",
        f"",
        f"RoadSense AI Summary Report — {zone}",
        f"{len(incidents)} pothole(s) reported in your ward requiring urgent attention:",
        f"",
    ]
    for i, p in enumerate(incidents, 1):
        sev = p.get("severity", "UNKNOWN").upper()
        loc = p.get("ward") or p.get("location") or p.get("address") or f"{p.get('latitude', '')}, {p.get('longitude', '')}"
        coords = f"{float(p.get('latitude', 0)):.4f}, {float(p.get('longitude', 0)):.4f}"
        reports = int(p.get("report_count", 1))
        loss = DAILY_LOSS.get(p.get("severity", "").lower(), 0)
        lines += [
            f"{i}. Location: {loc}",
            f"   Severity: {sev} | Reports: {reports} citizen(s) | Coordinates: {coords}",
            f"   Daily Economic Loss: ₹{loss:,}/day",
            f"",
        ]
    lines += [
        f"Total daily loss in your ward: ₹{total_loss:,}/day",
        f"",
        f"Please prioritize repairs urgently.",
        f"",
        f"— RoadSense AI System",
    ]
    return "\n".join(lines)


def run_batch() -> dict:
    """
    Core batch logic. Returns a summary dict with zones_count, potholes_count,
    and per-zone email bodies (for logging/preview — actual sending is via
    the mailto approach or an SMTP integration).
    """
    incidents = get_all_incidents()
    pending = [p for p in incidents if _needs_batch(p)]

    if not pending:
        return {"zones_count": 0, "potholes_count": 0, "zones": []}

    # Group by zone via reverse geocode (cache by rounded coords to reduce calls)
    geo_cache: dict[str, str] = {}
    zone_map: dict[str, list] = {}

    for p in pending:
        try:
            lat = float(p.get("latitude", 0))
            lon = float(p.get("longitude", 0))
        except (ValueError, TypeError):
            lat, lon = 0.0, 0.0
        key = f"{round(lat, 3)},{round(lon, 3)}"
        if key not in geo_cache:
            geo_cache[key] = _reverse_geocode_zone(lat, lon)
        zone = geo_cache[key]
        zone_map.setdefault(zone, []).append(p)

    result_zones = []
    for zone, zone_incidents in zone_map.items():
        email_body = _build_zone_email(zone, zone_incidents)
        result_zones.append({
            "zone": zone,
            "pothole_count": len(zone_incidents),
            "email_body": email_body,
            "incident_ids": [p["incident_id"] for p in zone_incidents],
        })
        for p in zone_incidents:
            _mark_sent(p["incident_id"])

    logger.info("Batch sent: %d zones, %d potholes", len(result_zones), len(pending))
    return {
        "zones_count": len(result_zones),
        "potholes_count": len(pending),
        "zones": result_zones,
    }


def increment_report_count(incident_id: str):
    """Atomically increment report_count on an existing incident."""
    table.update_item(
        Key={"incident_id": incident_id},
        UpdateExpression="SET report_count = if_not_exists(report_count, :zero) + :one",
        ExpressionAttributeValues={":zero": 0, ":one": 1},
    )
