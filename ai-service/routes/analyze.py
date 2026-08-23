from uuid import UUID

from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    UploadFile,
)

from fastapi.responses import (
    FileResponse,
)

from services.analyze_service import (
    RESULTS_DIR,
    analyze_image,
)

from schemas.analyze import (
    AnalyzeResponse,
)


router = APIRouter(
    prefix="/api/v1",
    tags=["Analysis"],
)


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    response_model_exclude_none=True,
)
async def analyze(
    image: UploadFile = File(...),
    imageId: UUID = Form(...),
):
    try:

        return await analyze_image(
            image=image,
            image_id=str(imageId),
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


@router.get(
    "/analyze/{image_id}/result"
)
async def get_analysis_result(
    image_id: UUID,
):

    result_path = (
        RESULTS_DIR
        / f"{image_id}_overlay.jpg"
    )

    if not result_path.exists():

        raise HTTPException(
            status_code=404,
            detail=(
                "Analysis result image "
                "not found."
            ),
        )

    return FileResponse(
        path=result_path,
        media_type="image/jpeg",
    )


@router.delete(
    "/analyze/{image_id}/result"
)
async def delete_analysis_result(
    image_id: UUID,
):
    result_path = (
        RESULTS_DIR
        / f"{image_id}_overlay.jpg"
    )

    if not result_path.exists():
        return {
            "deleted": False,
            "reason": "not_found",
        }

    result_path.unlink()

    return {
        "deleted": True,
    }
