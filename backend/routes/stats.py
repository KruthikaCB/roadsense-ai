from fastapi import APIRouter
from utils.response import success, error
from services.dynamo_service import get_all_incidents

router = APIRouter()

@router.get("/stats")
def get_stats():
    try:
        incidents = get_all_incidents()
        
        total = len(incidents)
        
        severity_counts = {"low": 0, "medium": 0, "high": 0}
        for incident in incidents:
            severity = incident.get("severity", "low").lower()
            if severity in severity_counts:
                severity_counts[severity] += 1
        
        status_counts = {"reported": 0, "resolved": 0}
        for incident in incidents:
            status = incident.get("status", "reported")
            if status in status_counts:
                status_counts[status] += 1

        return success({
            "total_incidents": total,
            "by_severity": severity_counts,
            "by_status": status_counts
        }, "Stats fetched successfully")

    except Exception as e:
        return error(str(e))
