from fastapi import APIRouter
from utils.response import success, error
from services.dynamo_service import get_all_incidents
from services.bedrock_service import generate_complaint

router = APIRouter()

@router.get("/complaint/{incident_id}")
def get_complaint(incident_id: str):
    try:
        # fetch all incidents and find the right one
        incidents = get_all_incidents()
        incident = next((i for i in incidents if i["incident_id"] == incident_id), None)
        
        if not incident:
            return error("Incident not found")

        complaint = generate_complaint(
            latitude=incident["latitude"],
            longitude=incident["longitude"],
            severity=incident["severity"],
            image_url=incident["image_url"]
        )

        return success({"complaint": complaint}, "Complaint generated")

    except Exception as e:
        return error(str(e))
