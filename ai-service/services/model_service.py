from ultralytics import YOLO


MODEL_NAME = "yolo26n"
MODEL_VERSION = "0.1.0"


model = YOLO(
    "yolo26n.pt"
)


def run_inference(
    image_path: str,
):
    results = model.predict(
        source=image_path,
        imgsz=640,
        conf=0.25,
        verbose=False,
    )

    return results[0]


def convert_detections(
    result,
):
    detections = []


    if result.boxes is None:
        return detections


    for (
        box,
        confidence,
        class_id,
    ) in zip(
        result.boxes.xyxy,
        result.boxes.conf,
        result.boxes.cls,
    ):

        class_id_value = int(
            class_id
        )


        confidence_value = float(
            confidence
        )


        coordinates = [
            float(value)
            for value
            in box
        ]


        class_name = (
            result.names[
                class_id_value
            ]
        )


        detections.append({
            "classId":
                class_id_value,

            "className":
                class_name,

            "confidence":
                round(
                    confidence_value,
                    4,
                ),

            "bbox":
                coordinates,
        })


    return detections