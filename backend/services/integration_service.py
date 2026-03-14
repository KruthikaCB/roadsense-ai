import uuid
from datetime import datetime, timezone
from services.ai_service import analyze_image, generate_complaint as ai_generate_complaint


def generate_incident_id():
    return str(uuid.uuid4())


def mock_ai_analysis(image=None):
    if image:
        return analyze_image(image)
    return {
        "severity": "medium",
        "confidence": 78,
        "type": "pothole"
    }


def mock_s3_upload():
    return {
        "image_url": "https://dummy-roadsense.s3.amazonaws.com/image.jpg"
    }


def build_incident_record(latitude, longitude, severity, image_url):
    return {
        "incident_id": generate_incident_id(),
        "latitude": latitude,
        "longitude": longitude,
        "severity": severity,
        "image_url": image_url,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "reported"
    }