"""
POST /api/upload

Accepts a pothole image + GPS coordinates, runs AI analysis via Bedrock,
stores the image in S3, and saves the incident record to DynamoDB.
"""

import io
import logging
from fastapi import APIRouter, File, UploadFile, Form
from fastapi.responses import JSONResponse
from services.aws_service import upload_to_s3
from services.bedrock_service import analyze_image_with_bedrock
from services.dynamo_service import save_incident

logger = logging.getLogger("roadsense.upload")
router = APIRouter()

# Human-readable messages for each AI rejection code
_AI_ERROR_MESSAGES = {
    "no_road":            "No road detected. Please upload a clear photo of a road or pothole.",
    "unclear_image":      "Image is too blurry or dark. Please upload a clearer photo.",
    "low_confidence":     "Could not analyze this image confidently. Try a clearer, well-lit photo.",
    "no_damage_detected": "No significant road damage detected in this image.",
    "bedrock_failed":     "AI analysis service is currently unavailable. Please try again.",
}

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/upload", tags=["Incidents"])
async def upload_pothole(
    image: UploadFile = File(...),
    latitude: str = Form(...),
    longitude: str = Form(...),
):
    """
    Analyze a pothole image and create an incident record.

    - Validates file type and size
    - Runs Bedrock Vision AI analysis
    - Uploads image to S3
    - Saves incident to DynamoDB
    - Returns AI results + incident ID
    """
    # --- Validate content type ---
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        logger.warning("Rejected upload: unsupported content type '%s'", image.content_type)
        return JSONResponse(status_code=400, content={
            "status": "error",
            "message": "Only JPEG, PNG, or WebP images are supported.",
        })

    image_bytes = await image.read()

    # --- Validate file size ---
    if len(image_bytes) > MAX_FILE_BYTES:
        logger.warning("Rejected upload: file size %d bytes exceeds 10 MB limit", len(image_bytes))
        return JSONResponse(status_code=400, content={
            "status": "error",
            "message": "Image too large. Please upload an image under 10 MB.",
        })

    logger.info("Running Bedrock AI analysis for upload at (%s, %s)", latitude, longitude)

    # --- AI analysis ---
    ai_result = analyze_image_with_bedrock(image_bytes)

    if isinstance(ai_result, dict) and "error" in ai_result:
        error_code = ai_result["error"]
        message = _AI_ERROR_MESSAGES.get(error_code, "Could not analyze this image.")
        logger.warning("AI rejected image with code '%s'", error_code)
        return JSONResponse(status_code=400, content={"status": "error", "message": message})

    # --- Upload image to S3 ---
    image_url = ""
    try:
        s3_result = upload_to_s3(io.BytesIO(image_bytes), image.content_type)
        image_url = s3_result.get("image_url", "")
        logger.info("Image uploaded to S3: %s", image_url)
    except Exception as exc:
        # Non-fatal: incident can still be saved without an image URL
        logger.error("S3 upload failed: %s", exc)

    # --- Save incident to DynamoDB ---
    try:
        incident = save_incident(
            latitude, longitude,
            ai_result.get("severity", "MEDIUM"),
            image_url,
            ai_result,
        )
        logger.info("Incident saved: %s", incident.get("incident_id"))
    except Exception as exc:
        logger.error("DynamoDB save failed: %s", exc)
        return JSONResponse(status_code=500, content={
            "status": "error",
            "message": "Failed to save incident. Please try again.",
        })

    return JSONResponse(content={
        "status": "success",
        "message": "Pothole reported successfully!",
        "data": {
            "incident_id":               incident.get("incident_id"),
            "severity":                  ai_result.get("severity"),
            "confidence":                ai_result.get("confidence"),
            "size_estimate":             ai_result.get("size_estimate"),
            "risk_level":                ai_result.get("risk_level"),
            "description":               ai_result.get("description"),
            "has_road_damage":           ai_result.get("has_road_damage"),
            "vehicle_damage_cost_per_day": ai_result.get("vehicle_damage_cost_per_day"),
            "repair_cost":               ai_result.get("repair_cost"),
            "monthly_savings_if_fixed":  ai_result.get("monthly_savings_if_fixed"),
            "image_url":                 image_url,
            "status":                    "reported",
            "timestamp":                 incident.get("timestamp"),
        },
    })
