import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routes import upload, potholes, stats, complaints, prediction

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("roadsense")

app = FastAPI(                          # ← app created FIRST
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
)

app.add_middleware(                     # ← THEN middleware (only once)
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router,      prefix="/api")
app.include_router(potholes.router,    prefix="/api")
app.include_router(stats.router,       prefix="/api")
app.include_router(complaints.router,  prefix="/api")
app.include_router(prediction.router,  prefix="/predict")

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "roadsense-backend"}

@app.get("/", tags=["System"])
def home():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "running",
    }
