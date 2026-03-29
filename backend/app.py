"""
RoadSense AI — FastAPI Application Entry Point

Registers all route modules and configures middleware.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings

from routes import upload, potholes, stats, complaints, prediction
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("roadsense")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
)

# ---------------------------------------------------------------------------
# CORS — allow all origins for local dev; tighten in production
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Route registration
# ---------------------------------------------------------------------------
app.include_router(upload.router,      prefix="/api")
app.include_router(potholes.router,    prefix="/api")
app.include_router(stats.router,       prefix="/api")
app.include_router(complaints.router,  prefix="/api")
app.include_router(prediction.router,  prefix="/predict")

# ---------------------------------------------------------------------------
# Utility endpoints
# ---------------------------------------------------------------------------

@app.get("/health", tags=["System"])
def health_check():
    """Returns service health status. Used by load balancers and monitoring."""
    return {"status": "ok", "service": "roadsense-backend"}


@app.get("/", tags=["System"])
def home():
    """Root endpoint — returns project metadata."""
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "running",
    }
