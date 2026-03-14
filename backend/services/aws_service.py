import boto3
import uuid
from botocore.exceptions import ClientError
from config import settings

s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY,      # not AWS_ACCESS_KEY_ID
    aws_secret_access_key=settings.AWS_SECRET_KEY,   # not AWS_SECRET_ACCESS_KEY
    region_name=settings.AWS_REGION
)

def upload_to_s3(file, content_type: str) -> dict:
    file_key = f"potholes/{uuid.uuid4()}.jpg"
    
    try:
        s3_client.upload_fileobj(
            file,
            settings.S3_BUCKET,
            file_key,
            ExtraArgs={"ContentType": content_type}
        )
        image_url = f"https://{settings.S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{file_key}"
        return {"image_url": image_url, "file_key": file_key}
    
    except ClientError as e:
        raise Exception(f"S3 upload failed: {str(e)}")
