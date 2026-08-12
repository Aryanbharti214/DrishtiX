from fastapi import APIRouter, File, HTTPException, UploadFile

from services.image_service import save_uploaded_image


router = APIRouter(
    prefix="/api/v1/images",
    tags=["Images"],
)


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...)
):
    try:
        result = await save_uploaded_image(file)

        return result

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )