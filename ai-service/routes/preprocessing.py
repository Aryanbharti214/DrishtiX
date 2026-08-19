from fastapi import APIRouter, HTTPException

from schemas.preprocessing import PreprocessingResponse
from services.preprocessing_service import preprocess_image


router = APIRouter(
    prefix="/api/v1/preprocessing",
    tags=["Preprocessing"],
)


@router.post(
    "/{image_id}",
    response_model=PreprocessingResponse,
)
async def preprocess_uploaded_image(image_id: str):

    try:
        result = preprocess_image(image_id)

        return result

    except FileNotFoundError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )