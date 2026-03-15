"""
GET    /api/potholes                      — list all incidents
GET    /api/potholes/{incident_id}        — get a single incident
PATCH  /api/potholes/{incident_id}/status — update repair status
POST   /api/potholes/{incident_id}/upvote — community upvote
"""

import logging
from fastapi import APIRouter
from utils.response import success, error
from services.dynamo_service import get_all_incidents, update_incident_status, table

logger = logging.getLogger("roadsense.potholes")
router = APIRouter()


@router.get("/potholes", tags=["Incidents"])
def get_potholes():
    """Return all pothole incidents stored in DynamoDB."""
    try:
        incidents = get_all_incidents()
        logger.info("Fetched %d incidents", len(incidents))
        return success(incidents, "Potholes fetched successfully")
    except Exception as exc:
        logger.error("Failed to fetch potholes: %s", exc)
        return error("Could not retrieve incidents. Please try again.")


@router.get("/potholes/{incident_id}", tags=["Incidents"])
def get_pothole(incident_id: str):
    """Return a single incident by its ID."""
    try:
        incidents = get_all_incidents()
        incident = next((i for i in incidents if i["incident_id"] == incident_id), None)
        if not incident:
            logger.warning("Incident not found: %s", incident_id)
            return error("Incident not found", code=404)
        return success(incident, "Incident fetched")
    except Exception as exc:
        logger.error("Failed to fetch incident %s: %s", incident_id, exc)
        return error("Could not retrieve incident. Please try again.")


@router.patch("/potholes/{incident_id}/status", tags=["Incidents"])
def update_status(incident_id: str, body: dict):
    """
    Update the repair status of an incident.

    Accepted status values: reported | under_review | in_progress | fixed
    """
    new_status = body.get("status")
    if not new_status:
        return error("Missing 'status' field in request body", code=400)

    valid_statuses = {"reported", "under_review", "in_progress", "fixed"}
    if new_status not in valid_statuses:
        return error(f"Invalid status '{new_status}'. Must be one of: {', '.join(valid_statuses)}", code=400)

    try:
        result = update_incident_status(incident_id, new_status)
        logger.info("Status updated for %s → %s", incident_id, new_status)
        return success(result, "Status updated")
    except Exception as exc:
        logger.error("Failed to update status for %s: %s", incident_id, exc)
        return error("Could not update status. Please try again.")


@router.post("/potholes/{incident_id}/upvote", tags=["Incidents"])
def upvote_pothole(incident_id: str):
    """
    Increment the community upvote count for an incident.
    Uses DynamoDB atomic counter to prevent race conditions.
    """
    try:
        table.update_item(
            Key={"incident_id": incident_id},
            UpdateExpression="SET upvotes = if_not_exists(upvotes, :zero) + :one",
            ExpressionAttributeValues={":zero": 0, ":one": 1},
        )
        # Fetch updated count to return to client
        incidents = get_all_incidents()
        incident = next((i for i in incidents if i["incident_id"] == incident_id), None)
        upvotes = int(incident.get("upvotes", 1)) if incident else 1
        logger.info("Upvoted incident %s — new count: %d", incident_id, upvotes)
        return success({"upvotes": upvotes}, "Upvoted successfully")
    except Exception as exc:
        logger.error("Failed to upvote incident %s: %s", incident_id, exc)
        return error("Could not register upvote. Please try again.")
