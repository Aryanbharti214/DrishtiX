from pathlib import Path

from ultralytics import YOLO


MODEL_NAME = "yolo26n"
MODEL_VERSION = "0.1.0"

model = YOLO("yolo26n.pt")


def run_inference(image_path: str):
    results = model.predict(
        source=image_path,
        imgsz=640,
        conf=0.25,
        verbose=False,
    )

    return results[0]


def convert_detections_to_findings(result):
    findings = []

    for box, confidence, class_id in zip(
        result.boxes.xyxy,
        result.boxes.conf,
        result.boxes.cls,
    ):
        class_id = int(class_id)
        confidence = float(confidence)

        coordinates = [
            float(value)
            for value in box
        ]

        class_name = result.names[class_id]

        findings.append(
            {
                "type": class_name,
                "severity": "unknown",
                "confidence": round(confidence, 4),
                "bbox": coordinates,
                "prediction": {
                    "class_id": class_id,
                    "class_name": class_name,
                    "source": "generic_pretrained_model",
                },
            }
        )

    return findings