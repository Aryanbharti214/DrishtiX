import time
from pathlib import Path

from fastapi import UploadFile

from services.model_service import (
    MODEL_NAME,
    MODEL_VERSION,
    convert_segmentation_to_findings,
    generate_segmentation_overlay,
    run_inference,
)


BASE_DIR = Path(__file__).resolve().parent.parent

TEMP_DIR = BASE_DIR / "temp"
RESULTS_DIR = BASE_DIR / "analysis_results"

TEMP_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)


async def analyze_image(
    image: UploadFile,
    image_id: str,
):
    start_time = time.perf_counter()

    image_bytes = await image.read()

    if not image_bytes:
        raise ValueError("Uploaded image is empty.")

    extension = Path(image.filename or "").suffix.lower()

    if extension not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise ValueError("Unsupported image format.")

    temporary_path = TEMP_DIR / f"{image_id}{extension}"

    temporary_path.write_bytes(image_bytes)

    result_image_path = (
        RESULTS_DIR / f"{image_id}_overlay.jpg"
    )

    try:
        # ----------------------------------------------------
        # AI INFERENCE
        # ----------------------------------------------------

        result = run_inference(
            str(temporary_path)
        )

        # ----------------------------------------------------
        # FINDINGS
        # ----------------------------------------------------

        findings = convert_segmentation_to_findings(
            result
        )

        # ----------------------------------------------------
        # SEGMENTATION OVERLAY
        # ----------------------------------------------------

        generate_segmentation_overlay(
            result=result,
            original_image_path=temporary_path,
            output_path=result_image_path,
        )

    finally:
        if temporary_path.exists():
            temporary_path.unlink()

    processing_time_ms = (
        time.perf_counter() - start_time
    ) * 1000

    return {
        "model_name": MODEL_NAME,
        "model_version": MODEL_VERSION,
        "processing_time_ms": round(
            processing_time_ms,
            2,
        ),
        "result_image": (
            f"/api/v1/analyze/{image_id}/result"
        ),
        "findings": findings,
    }