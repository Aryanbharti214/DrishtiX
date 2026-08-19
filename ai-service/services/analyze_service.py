import time

from pathlib import Path

from fastapi import UploadFile

from services.model_service import (
    MODEL_NAME,
    MODEL_VERSION,
    convert_detections,
    run_inference,
)


TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)


ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}


async def analyze_image(
    image: UploadFile,
    image_id: str,
):
    start_time = time.perf_counter()

    image_bytes = await image.read()

    if not image_bytes:
        raise ValueError(
            "Uploaded image is empty."
        )

    extension = Path(
        image.filename or ""
    ).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError(
            "Unsupported image format."
        )

    temporary_path = (
        TEMP_DIR
        / f"{image_id}{extension}"
    )

    temporary_path.write_bytes(
        image_bytes
    )

    try:
        result = run_inference(
            str(temporary_path)
        )

        detections = (
            convert_detections(
                result
            )
        )

    finally:
        if temporary_path.exists():
            temporary_path.unlink()

    processing_time_ms = (
        time.perf_counter()
        - start_time
    ) * 1000

    return {
        "imageId": image_id,

        "analysisType":
            "GENERIC_OBJECT_DETECTION",

        "model": {
            "name":
                MODEL_NAME,

            "version":
                MODEL_VERSION,
        },

        "processingTimeMs":
            round(
                processing_time_ms,
                2,
            ),

        "detections":
            detections,

        "findings":
            [],
    }