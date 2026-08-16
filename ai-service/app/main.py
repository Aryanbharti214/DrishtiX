from fastapi import FastAPI

from routes.analyze import router as analyze_router
from routes.images import router as image_router
from routes.preprocessing import router as preprocessing_router


app = FastAPI(
    title="DrishtiX AI Service",
    description="AI service for post-disaster damage assessment",
    version="0.4.0",
)


app.include_router(image_router)
app.include_router(preprocessing_router)
app.include_router(analyze_router)


@app.get("/")
def root():
    return {
        "service": "DrishtiX AI Service",
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }