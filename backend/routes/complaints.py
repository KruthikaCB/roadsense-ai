"""
GET /api/complaint/{incident_id}

Generates a formal BBMP RTI complaint letter for a reported pothole using
Bedrock AI, reverse-geocodes the GPS coordinates to a street name, and
marks the incident as complaint_sent in DynamoDB.
"""

import json
import logging
import urllib.request
from fastapi import APIRouter
from utils.response import success, error
from services.dynamo_service import get_all_incidents, table
from services.bedrock_service import generate_complaint
from services.complaint_service import run_batch

logger = logging.getLogger("roadsense.complaints")
router = APIRouter()


def _reverse_geocode(latitude: str, longitude: str) -> str:
    """
    Convert GPS coordinates to a human-readable street address using
    the Nominatim (OpenStreetMap) reverse geocoding API.

    Falls back to a coordinate string if the request fails.
    """
    try:
        url = (
            f"https://nominatim.openstreetmap.org/reverse"
            f"?lat={latitude}&lon={longitude}&format=json"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "RoadSenseAI/1.0"})
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode("utf-8"))
            addr = data.get("address", {})
            parts = [
                addr.get("road") or addr.get("pedestrian") or addr.get("path"),
                addr.get("suburb") or addr.get("neighbourhood"),
                addr.get("city") or addr.get("town") or "Bengaluru",
            ]
            return ", ".join(p for p in parts if p)
    except Exception as exc:
        logger.warning("Reverse geocode failed for (%s, %s): %s", latitude, longitude, exc)
        return f"Near ({latitude}, {longitude}), Bengaluru"


@router.get("/complaint/{incident_id}", tags=["Complaints"])
def get_complaint(incident_id: str):
    """
    Generate a BBMP RTI complaint letter for a given incident.

    Steps:
    1. Fetch the incident from DynamoDB
    2. Reverse-geocode coordinates to a street name
    3. Generate the complaint letter via Bedrock AI
    4. Mark the incident as complaint_sent = True in DynamoDB
    5. Return the complaint text
    """
    try:
        incidents = get_all_incidents()
        incident = next((i for i in incidents if i["incident_id"] == incident_id), None)

        if not incident:
            logger.warning("Complaint requested for unknown incident: %s", incident_id)
            return error("Incident not found", code=404)

        street_name = _reverse_geocode(incident["latitude"], incident["longitude"])
        logger.info("Generating complaint for incident %s at '%s'", incident_id, street_name)

        complaint = generate_complaint(
            incident_id=incident["incident_id"],
            latitude=incident["latitude"],
            longitude=incident["longitude"],
            street_name=street_name,
            severity=incident["severity"],
            image_url=incident.get("image_url", ""),
            timestamp=incident.get("timestamp", ""),
            confidence=incident.get("confidence", "N/A"),
            size_estimate=incident.get("size_estimate", "N/A"),
            risk_level=incident.get("risk_level", "N/A"),
            description=incident.get("description", "N/A"),
            vehicle_damage_cost=int(float(incident.get("vehicle_damage_cost_per_day", 0))),
            repair_cost=int(float(incident.get("repair_cost", 0))),
            monthly_savings=int(float(incident.get("monthly_savings_if_fixed", 0))),
        )

        # Mark complaint as sent so the frontend can reflect this
        table.update_item(
            Key={"incident_id": incident_id},
            UpdateExpression="SET complaint_sent = :val",
            ExpressionAttributeValues={":val": True},
        )
        logger.info("Complaint generated and marked sent for incident %s", incident_id)

        return success({"complaint": complaint}, "Complaint generated")

    except Exception as exc:
        logger.error("Failed to generate complaint for %s: %s", incident_id, exc)
        return error("Could not generate complaint. Please try again.")


@router.post("/complaints/send-batch", tags=["Complaints"])
def send_batch_complaints():
    """
    Groups all pending potholes by zone and generates one summary email per zone.
    Marks all included incidents as complaint_sent = True.
    Only callable by BBMP admin.
    """
    try:
        result = run_batch()
        zones = result.get("zones", [])
        zones_count = result.get("zones_count", 0)
        potholes_count = result.get("potholes_count", 0)

        if potholes_count == 0:
            return success(
                {"zones_count": 0, "potholes_count": 0, "zones": []},
                "No pending potholes to report."
            )

        logger.info("Batch complaint sent: %d zones, %d potholes", zones_count, potholes_count)
        return success(
            {"zones_count": zones_count, "potholes_count": potholes_count, "zones": zones},
            f"Batch report sent for {zones_count} zone(s) covering {potholes_count} pothole(s)."
        )
    except Exception as exc:
        logger.error("Batch complaint failed: %s", exc)
        return error("Could not send batch report. Please try again.")
