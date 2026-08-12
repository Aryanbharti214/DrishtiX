from fastapi import FastAPI

from routes.images import router as image_router


app = FastAPI(
    title="DrishtiX AI Service",
    description="AI service for post-disaster damage assessment",
    version="0.2.0",
)


app.include_router(image_router)


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