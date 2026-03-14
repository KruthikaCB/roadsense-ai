import os
from dotenv import load_dotenv

load_dotenv()


class Settings:

    PROJECT_NAME="RoadSense AI"

    VERSION="1.0"

    DESCRIPTION="AI powered road incident detection system"


    # AWS CONFIG

    AWS_ACCESS_KEY=os.getenv("AWS_ACCESS_KEY")

    AWS_SECRET_KEY=os.getenv("AWS_SECRET_KEY")

    AWS_REGION=os.getenv("AWS_REGION","ap-south-1")

    S3_BUCKET=os.getenv("S3_BUCKET","roadsense-ai-bucket")

    DYNAMODB_TABLE=os.getenv("DYNAMODB_TABLE","roadsense-incidents")

    # AI CONFIG

    BEDROCK_MODEL=os.getenv(
        "BEDROCK_MODEL",
        "anthropic.claude-v2"
    )


    # APP CONFIG

    MAX_FILE_SIZE=10

    ALLOWED_TYPES=["image/jpeg","image/png","image/jpg"]


    # MAP DEFAULTS

    DEFAULT_RADIUS=5


settings=Settings()
def get_settings():

    return settings
