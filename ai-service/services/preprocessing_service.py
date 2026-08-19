from pathlib import Path

import cv2
import numpy as np


UPLOAD_DIR = Path("uploads")
PROCESSED_DIR = Path("processed")

PROCESSED_DIR.mkdir(exist_ok=True)


ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}


def find_uploaded_image(image_id: str) -> Path:
    """
    Find the uploaded image associated with an image ID.
    """

    for extension in ALLOWED_EXTENSIONS:
        file_path = UPLOAD_DIR / f"{image_id}{extension}"

        if file_path.exists():
            return file_path

    raise FileNotFoundError(
        f"No uploaded image found for image_id: {image_id}"
    )


def preprocess_image(
    image_id: str,
    target_size: tuple[int, int] = (640, 640),
):
    """
    Load and preprocess an uploaded image.

    Steps:
    1. Find the original image.
    2. Read it with OpenCV.
    3. Validate that OpenCV decoded it.
    4. Resize it.
    5. Convert BGR to RGB.
    6. Normalize pixel values to 0-1.
    7. Save a visualized processed image.
    8. Return metadata.
    """

    input_path = find_uploaded_image(image_id)

    image = cv2.imread(str(input_path))

    if image is None:
        raise ValueError(
            "The file exists but could not be decoded as an image."
        )

    original_height, original_width = image.shape[:2]

    resized_image = cv2.resize(
        image,
        target_size,
        interpolation=cv2.INTER_AREA,
    )

    rgb_image = cv2.cvtColor(
        resized_image,
        cv2.COLOR_BGR2RGB,
    )

    normalized_image = rgb_image.astype(np.float32) / 255.0

    processed_filename = f"{image_id}.jpg"

    processed_path = PROCESSED_DIR / processed_filename

    cv2.imwrite(
        str(processed_path),
        cv2.cvtColor(
            rgb_image,
            cv2.COLOR_RGB2BGR,
        ),
    )

    return {
        "image_id": image_id,
        "original_width": original_width,
        "original_height": original_height,
        "processed_width": target_size[0],
        "processed_height": target_size[1],
        "channels": 3,
        "color_space": "RGB",
        "normalization": "0-1",
        "dtype": str(normalized_image.dtype),
        "processed_path": str(processed_path),
    }