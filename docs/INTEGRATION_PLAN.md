# RoadSense AI Integration Plan

## Purpose

This document defines how backend, AI, AWS, and frontend will connect together.

Integration order must be followed to avoid conflicts.


## System Flow

Image Upload
→ Backend receives file
→ AWS S3 stores image
→ AI analyzes severity
→ GPS tagging added
→ DynamoDB stores record
→ Backend returns response
→ Frontend dashboard updates


## Backend Integration Responsibilities

Owner: Integration Lead

Tasks:

- Maintain app.py
- Route registration
- Config management
- Integration testing
- API contracts
- Merge coordination


## API Integration Order

Phase 1 (Foundation)

Working routes:
- upload route
- pothole route
- stats route

Goal:
Backend must run without errors.


Phase 2 (Mock Integration)

Temporary logic:

AI:
Return dummy severity.

AWS:
Return dummy image URL.

Goal:
Test full flow without dependencies.


Phase 3 (Real Integration)

AWS teammate connects:

S3 upload
DynamoDB storage
Bedrock AI call

AI teammate connects:

Severity detection
Traffic impact
Duplicate detection

Goal:
Replace mocks with real services.


## Service Contracts

AI Service must return:

severity
confidence
incident_type

Example:

{
 "severity":"medium",
 "confidence":82,
 "type":"pothole"
}


AWS Service must return:

image_url
record_id

Example:

{
 "image_url":"s3 link",
 "record_id":"uuid"
}


## Integration Rules

Rules team must follow:

1 Do not modify app.py without approval

2 Do not change API response format

3 Do not hardcode AWS credentials

4 All services must use config.py

5 All responses must use utils/response.py


## Branch Strategy

Branches:

main → stable

backend-dev → backend work

ai-dev → AI logic

aws-dev → AWS integration

frontend-dev → UI


## Testing Strategy

Every feature must pass:

Backend runs

API visible in Swagger

No import errors

No hardcoded keys


## Integration Milestones

Milestone 1:

Backend skeleton running

Milestone 2:

Upload API working with mock services

Milestone 3:

AWS S3 upload working

Milestone 4:

AI severity detection working

Milestone 5:

Frontend dashboard connected


## Current Status

Completed:

Project structure
Backend skeleton
Route integration

In Progress:

Upload API
AWS setup
AI service mock


## Next Integration Target

Goal:

POST /api/upload working with:

image
location
severity
image_url

This is first demo feature.


## Integration Lead Notes

Never block development waiting for dependencies.

Use:

Mock services
Dummy responses
Clear contracts

Integration first.
Optimization later.