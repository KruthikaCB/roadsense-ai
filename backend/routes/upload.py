from fastapi import APIRouter, File, UploadFile, Form
from fastapi.responses import JSONResponse
from services.aws_service import upload_to_s3
from services.bedrock_service import analyze_image_with_bedrock
from services.dynamo_service import save_incident

router = APIRouter()

@router.post("/upload")
async def upload_pothole(
    image: UploadFile = File(...),
    latitude: str = Form(...),
    longitude: str = Form(...)
):
    # Validate file type
    if image.content_type not in ["image/jpeg", "image/png", "image/jpg", "image/webp"]:
        return JSONResponse(status_code=400, content={
            "status": "error",
            "message": "Only JPEG, PNG, or WebP images are supported."
        })

    # Read image bytes
    image_bytes = await image.read()

    # Validate file size (max 10MB)
    if len(image_bytes) > 10 * 1024 * 1024:
        return JSONResponse(status_code=400, content={
            "status": "error",
            "message": "Image too large. Please upload an image under 10MB."
        })

    # Run AI analysis
    ai_result = analyze_image_with_bedrock(image_bytes)

    # Handle AI errors
    if isinstance(ai_result, dict) and "error" in ai_result:
        error_messages = {
            "no_road": "❌ No road detected. Please upload a clear photo of a road or pothole.",
            "unclear_image": "❌ Image is too blurry or dark. Please upload a clearer photo.",
            "low_confidence": "❌ Could not analyze this image confidently. Try a clearer, well-lit photo.",
            "no_damage_detected": "✅ No significant road damage detected in this image.",
            "bedrock_failed": "❌ AI analysis service is currently unavailable. Please try again."
        }
        msg = error_messages.get(ai_result["error"], "❌ Could not analyze this image.")
        return JSONResponse(status_code=400, content={
            "status": "error",
            "message": msg
        })

    # Upload to S3
    try:
        s3_result = upload_to_s3(image_bytes, image.content_type)
        image_url = s3_result["image_url"]
    except Exception as e:
        print(f"S3 upload error: {e}")
        image_url = ""

    # Save to DynamoDB
    try:
        incident = save_incident(latitude, longitude, ai_result.get("severity", "MEDIUM"), image_url, ai_result)
    except Exception as e:
        print(f"DynamoDB save error: {e}")
        return JSONResponse(status_code=500, content={
            "status": "error",
            "message": "Failed to save incident. Please try again."
        })

    return JSONResponse(content={
        "status": "success",
        "message": "Pothole reported successfully!",
        "data": {
            "incident_id": incident.get("incident_id"),
            "severity": ai_result.get("severity"),
            "confidence": ai_result.get("confidence"),
            "size_estimate": ai_result.get("size_estimate"),
            "risk_level": ai_result.get("risk_level"),
            "description": ai_result.get("description"),
            "has_road_damage": ai_result.get("has_road_damage"),
            "vehicle_damage_cost_per_day": ai_result.get("vehicle_damage_cost_per_day"),
            "repair_cost": ai_result.get("repair_cost"),
            "monthly_savings_if_fixed": ai_result.get("monthly_savings_if_fixed"),
            "image_url": image_url,
            "status": "reported",
            "timestamp": incident.get("timestamp")
        }
    })