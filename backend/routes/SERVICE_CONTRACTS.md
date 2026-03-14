# RoadSense AI Service Contracts


## Purpose

This document defines how backend connects to AI and AWS services.

Routes must never directly call AWS or AI.

Routes only call integration_service.

Integration_service calls AWS and AI.


## Integration Pattern

Routes
→ integration_service
→ aws_service
→ ai_service


This prevents breaking routes when services change.


## AWS Service Contract

File:

backend/services/aws_service.py


Must implement:

upload_image(file)

store_incident(record)



upload_image input:

image file


upload_image output:

{
 "image_url":"s3 url"
}



store_incident input:

incident record


store_incident output:

{
 "record_id":"uuid"
}



## AI Service Contract

File:

backend/services/ai_service.py


Must implement:

analyze_image(file)



Input:

image file


Output:

{
 "severity":"high",

 "confidence":85,

 "incident_type":"pothole"
}



## Integration Service Role

File:

backend/services/integration_service.py


Responsibilities:

Call AI service

Call AWS service

Build incident record

Return formatted data


Routes must ONLY call:

analyze_incident()

upload_incident_image()

build_incident_record()



## Rules

AWS teammate must not modify routes.

AI teammate must not modify routes.

Only integration lead modifies:

integration_service.py

app.py

config.py



## Current Mock Behavior

Currently:

AI returns dummy severity.

AWS returns dummy image URL.


Later replaced by real services.


## Replacement Plan

Replace:

mock logic

with:

aws_service.upload_image()

ai_service.analyze_image()



No route changes needed.


## Goal

AWS teammate should only work inside:

aws_service.py


AI teammate only inside:

ai_service.py


Integration lead connects them.