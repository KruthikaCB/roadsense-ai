"""
GET /api/stats

Returns aggregated statistics across all incidents:
total count, breakdown by severity, and breakdown by status.
"""

import logging
from fastapi import APIRouter
from utils.response import success, error
from services.dynamo_service import get_all_incidents

logger = logging.getLogger("roadsense.stats")
router = APIRouter()


@router.get("/stats", tags=["Analytics"])
def get_stats():
    """
    Aggregate incident statistics from DynamoDB.

    Returns:
    - total_incidents: total number of reports
    - by_severity: counts for low / medium / high / critical
    - by_status: counts for reported / resolved
    """
    try:
        incidents = get_all_incidents()

        severity_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        status_counts = {"reported": 0, "resolved": 0}

        for incident in incidents:
            severity = incident.get("severity", "low").lower()
            if severity in severity_counts:
                severity_counts[severity] += 1

            status = incident.get("status", "reported")
            if status in status_counts:
                status_counts[status] += 1

        logger.info(
            "Stats computed — total: %d, severity: %s, status: %s",
            len(incidents), severity_counts, status_counts,
        )

        return success({
            "total_incidents": len(incidents),
            "by_severity": severity_counts,
            "by_status": status_counts,
        }, "Stats fetched successfully")

    except Exception as exc:
        logger.error("Failed to compute stats: %s", exc)
        return error("Could not retrieve statistics. Please try again.")
