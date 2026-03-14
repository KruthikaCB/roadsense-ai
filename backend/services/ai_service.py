def analyze_image(image):
    """
    Simulates pothole severity detection based on image size.
    """

    try:
        # Read image bytes
        image_bytes = image.file.read()
        file_size = len(image_bytes)

        # Determine severity based on image size
        if file_size < 200000:
            severity = "LOW"
        elif file_size < 500000:
            severity = "MEDIUM"
        elif file_size < 1000000:
            severity = "HIGH"
        else:
            severity = "CRITICAL"

        confidence = 85

        # Risk description (useful for demo explanation)
        risk_descriptions = {
            "LOW": "Minor road surface damage with low impact on vehicles.",
            "MEDIUM": "Moderate pothole that may affect small vehicles.",
            "HIGH": "Large pothole causing traffic disruption and vehicle damage risk.",
            "CRITICAL": "Severe pothole posing serious accident risk and immediate repair required."
        }

        risk_description = risk_descriptions.get(severity)

    except Exception:
        severity = "MEDIUM"
        confidence = 70
        risk_description = "Road damage detected."

    return {
        "severity": severity,
        "confidence": confidence,
        "risk_level": severity,
        "risk_description": risk_description,
        "incident_type": "pothole"
    }


def generate_complaint(location, severity, latitude, longitude):
    """
    Generates a complaint message for municipal authorities.
    """

    risk_messages = {
        "LOW": "Minor road surface damage detected.",
        "MEDIUM": "Moderate pothole affecting vehicle movement.",
        "HIGH": "Serious pothole causing traffic disruption.",
        "CRITICAL": "Severe pothole posing accident risk and requiring urgent repair."
    }

    description = risk_messages.get(severity, "Road damage detected.")

    complaint = f"""
Subject: Urgent pothole repair request

Location: {location}
Severity Level: {severity}
Coordinates: {latitude}, {longitude}

Issue Description:
{description}

This issue has been detected through the RoadSense AI monitoring system.

Immediate inspection and repair are recommended to prevent accidents and traffic disruption.

Reported by:
RoadSense AI Automated Road Monitoring System
"""

    return complaint