# RoadSense AI Setup Guide


## Backend Setup

Requirements:

Python 3.10+

pip

Git


## Installation

Clone repo:

git clone repo_url

cd roadsense-ai/backend


Install dependencies:

pip install -r requirements.txt


## Environment setup

Create:

.env

Add:

AWS_ACCESS_KEY=dummy

AWS_SECRET_KEY=dummy

AWS_REGION=ap-south-1

S3_BUCKET=roadsense-ai-bucket

DYNAMODB_TABLE=roadsense-incidents


## Run backend

cd backend

python -m uvicorn app:app --reload


## Open API docs

http://127.0.0.1:8000/docs


## Expected working endpoints

GET /

GET /health

POST /api/upload

GET /api/potholes-test

GET /api/stats-test


## Development rules

Do not hardcode AWS keys.

Do not modify config structure.

Use response utils.

Follow API spec.


## Troubleshooting

If uvicorn not found:

python -m uvicorn app:app --reload


If import errors:

Check __init__.py files.


## Current stage

Backend skeleton working.

Upload mock working.

AWS integration pending.

AI integration pending.