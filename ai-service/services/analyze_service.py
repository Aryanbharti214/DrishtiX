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

from services.priority_service import (
    calculate_priority,
)


BASE_DIR = Path(__file__).resolve().parent.parent

TEMP_DIR = BASE_DIR / "temp"
RESULTS_DIR = BASE_DIR / "analysis_results"

TEMP_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)


FINDING_TYPE_MAP = {
    "Building-flooded": "BUILDING_DAMAGE",
    "Road-flooded": "ROAD_BLOCKAGE",
}


SEVERITY_MAP = {
    "low": "LOW",
    "medium": "MODERATE",
    "high": "SEVERE",
    "critical": "CRITICAL",
}


def normalize_disaster_findings(
    raw_findings,
):
    """
    Convert raw FloodNet semantic classes into
    DrishtiX domain-level disaster findings.

    Context classes such as Water, Tree, Grass, etc.
    are intentionally NOT stored as disaster findings.
    """

    normalized = []

    for finding in raw_findings:

        raw_type = finding["type"]

        domain_type = FINDING_TYPE_MAP.get(
            raw_type
        )

        if domain_type is None:
            continue

        severity = SEVERITY_MAP.get(
            finding["severity"]
        )

        area_percentage = float(
            finding["area_percentage"]
        )

        raw_prediction = finding.get(
            "prediction",
            {},
        )

        if raw_type == "Building-flooded":

            title = (
                "Flooded building region detected"
            )

            description = (
                f"{area_percentage:.2f}% of the image "
                "area was classified as flooded "
                "building regions."
            )

        else:

            title = (
                "Flooded road region detected"
            )

            description = (
                f"{area_percentage:.2f}% of the image "
                "area was classified as flooded "
                "road regions."
            )

        normalized.append(
            {
                "type": domain_type,

                "severity": severity,

                "title": title,

                "description": description,

                "confidence": finding.get(
                    "confidence"
                ),

                "bbox": finding.get(
                    "bbox"
                ),

                "prediction": {
                    "classId":
                        raw_prediction.get(
                            "class_id"
                        ),

                    "className":
                        raw_prediction.get(
                            "class_name"
                        ),

                    "source":
                        raw_prediction.get(
                            "source"
                        ),

                    "pixelCount":
                        finding.get(
                            "pixel_count"
                        ),

                    "areaPercentage":
                        area_percentage,

                    "semanticSeverity":
                        finding.get(
                            "severity"
                        ),
                },
            }
        )

    return normalized


async def analyze_floodnet_image(
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

    if extension not in {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    }:
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

    result_image_path = (
        RESULTS_DIR
        / f"{image_id}_overlay.jpg"
    )

    try:
        # ---------------------------------------------
        # AI inference
        # ---------------------------------------------

        result = run_inference(
            str(temporary_path)
        )

        # ---------------------------------------------
        # Raw semantic findings
        # ---------------------------------------------

        raw_findings = (
            convert_segmentation_to_findings(
                result
            )
        )

        # ---------------------------------------------
        # Decision-support priority
        # Uses raw semantic data
        # ---------------------------------------------

        priority = calculate_priority(
            raw_findings
        )

        # ---------------------------------------------
        # Convert semantic classes into DrishtiX
        # domain findings
        # ---------------------------------------------

        findings = (
            normalize_disaster_findings(
                raw_findings
            )
        )

        # ---------------------------------------------
        # Overlay
        # ---------------------------------------------

        generate_segmentation_overlay(
            result=result,
            original_image_path=
                temporary_path,
            output_path=
                result_image_path,
        )

    finally:

        if temporary_path.exists():
            temporary_path.unlink()

    processing_time_ms = (
        time.perf_counter()
        - start_time
    ) * 1000

    return {
        "imageId":
            image_id,

        "analysisType":
            "DISASTER_DAMAGE_ASSESSMENT",

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

        "resultImage":
            (
                f"/api/v1/analyze/"
                f"{image_id}/result"
            ),

        "priority":
            priority,

        "detections":
            [],

        "findings":
            findings,

        "segmentationSummary":
            raw_findings,
    }


async def analyze_image(
    image: UploadFile,
    image_id: str,
    source_type: str = "DRONE",
    analysis_mode: str = "SINGLE_IMAGE",
    before_image: UploadFile | None = None,
):
    if source_type == "SATELLITE":
        from services.satellite_analysis_service import analyze_satellite_image

        return await analyze_satellite_image(
            image=image,
            image_id=image_id,
            result_path=RESULTS_DIR / f"{image_id}_overlay.jpg",
            before_image=before_image,
            analysis_mode=analysis_mode,
        )

    # DRONE and the existing STREET behavior stay on the frozen FloodNet path.
    return await analyze_floodnet_image(
        image=image,
        image_id=image_id,
    )
