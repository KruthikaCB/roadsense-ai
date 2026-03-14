from fastapi import APIRouter
from utils.response import success, error
from services.dynamo_service import get_all_incidents, update_incident_status

router = APIRouter()

@router.get("/potholes")
def get_potholes():
    try:
        incidents = get_all_incidents()
        return success(incidents, "Potholes fetched successfully")
    except Exception as e:
        return error(str(e))

@router.patch("/potholes/{incident_id}/status")
def update_status(incident_id: str, body: dict):
    try:
        result = update_incident_status(incident_id, body.get("status"))
        return success(result, "Status updated")
    except Exception as e:
        return error(str(e))