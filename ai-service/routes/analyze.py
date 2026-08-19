from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from schemas.analyze import AnalyzeResponse
from services.analyze_service import analyze_image


router = APIRouter(
    prefix="/api/v1",
    tags=["Analysis"],
)


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
)
async def analyze(
    image: UploadFile = File(...),
    imageId: str = Form(...),
):
    try:
        result = await analyze_image(
            image=image,
            image_id=imageId,
        )

        return result

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )