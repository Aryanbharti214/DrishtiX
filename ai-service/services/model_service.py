from pathlib import Path

import numpy as np
from ultralytics import YOLO


# ============================================================
# MODEL CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "models" / "best.pt"

MODEL_NAME = "floodnet-yolo26n-sem"
MODEL_VERSION = "1.0.0"

model = YOLO(str(MODEL_PATH))


# ============================================================
# CLASS NAMES
# ============================================================

CLASS_NAMES = {
    0: "Background",
    1: "Building-flooded",
    2: "Building-non-flooded",
    3: "Road-flooded",
    4: "Road-non-flooded",
    5: "Water",
    6: "Tree",
    7: "Vehicle",
    8: "Pool",
    9: "Grass",
}


FLOODED_CLASSES = {
    1,
    3,
}


# ============================================================
# RUN SEMANTIC SEGMENTATION
# ============================================================

def run_inference(image_path: str):

    results = model.predict(
        source=image_path,
        imgsz=640,
        verbose=False,
    )

    return results[0]


# ============================================================
# SEVERITY
# ============================================================

def calculate_severity(area_percentage: float) -> str:

    if area_percentage >= 30:
        return "critical"

    if area_percentage >= 15:
        return "high"

    if area_percentage >= 5:
        return "medium"

    return "low"


# ============================================================
# CONVERT SEGMENTATION TO FINDINGS
# ============================================================

def convert_segmentation_to_findings(result):

    semantic_mask = (
        result.semantic_mask.data
        .cpu()
        .numpy()
    )

    # Remove unnecessary dimensions if present
    semantic_mask = np.squeeze(semantic_mask)

    total_pixels = semantic_mask.size

    findings = []

    for class_id, class_name in CLASS_NAMES.items():

        pixel_count = int(
            np.sum(semantic_mask == class_id)
        )

        if pixel_count == 0:
            continue

        area_percentage = (
            pixel_count / total_pixels
        ) * 100

        # ----------------------------------------------------
        # Bounding box of this semantic class
        # ----------------------------------------------------

        ys, xs = np.where(
            semantic_mask == class_id
        )

        bbox = None

        if len(xs) > 0:

            bbox = [
                float(xs.min()),
                float(ys.min()),
                float(xs.max()),
                float(ys.max()),
            ]

        # ----------------------------------------------------
        # Severity
        # ----------------------------------------------------

        if class_id in FLOODED_CLASSES:

            severity = calculate_severity(
                area_percentage
            )

        else:

            severity = "informational"

        findings.append(
            {
                "type": class_name,
                "severity": severity,
                "pixel_count": pixel_count,
                "area_percentage": round(
                    area_percentage,
                    2,
                ),
                "bbox": bbox,
                "prediction": {
                    "class_id": class_id,
                    "class_name": class_name,
                    "source": "floodnet_semantic_segmentation",
                },
            }
        )

    return findings