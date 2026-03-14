# RoadSense AI — Kiro Spec

## Overview
RoadSense AI is an AI-powered pothole detection and BBMP complaint automation system for Bengaluru. Citizens upload road images, AWS Bedrock Vision analyzes severity, and the system auto-generates RTI-format complaints routed to the correct BBMP ward.

## Problem Statement
Bengaluru has 10,000+ potholes causing ₹1000+ crore in vehicle damage annually. Existing complaint systems are manual, slow, and lack data-driven prioritization. BBMP has no automated way to triage repair urgency.

## Solution
- AI-powered image analysis using Amazon Bedrock Claude 3 Haiku
- Automatic severity classification (LOW/MEDIUM/HIGH/CRITICAL)
- Economic loss estimation per pothole
- RTI-format auto-complaint generation
- Ward-wise routing to correct BBMP officer
- Live map with TomTom real-time traffic overlay
- Repair priority scoring for BBMP

## User Stories
1. As a citizen, I want to report a pothole by uploading a photo so BBMP gets notified automatically
2. As a citizen, I want my location auto-detected so I don't need to enter coordinates
3. As BBMP, I want to see severity-ranked potholes so I can prioritize repairs by ROI
4. As BBMP, I want auto-generated RTI complaints so I can act without manual processing
5. As a city planner, I want zone-wise traffic impact scores so I can allocate resources efficiently

## AWS Services Used
- **Amazon S3** — stores pothole images
- **Amazon DynamoDB** — stores incident records with AI metadata
- **Amazon Bedrock (Claude 3 Haiku)** — vision analysis + complaint generation
- **FastAPI on local** — REST API backend

## Success Metrics
- Upload to AI result in under 10 seconds
- Complaint generated in under 5 seconds
- Map loads with all incidents in under 3 seconds
- Economic ROI clearly shown per pothole