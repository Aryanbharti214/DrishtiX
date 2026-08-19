from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO


MODEL_PATH = Path("models/best.pt")
IMAGE_PATH = Path("test_images/test.jpg")

OUTPUT_DIR = Path("debug_output")
OUTPUT_DIR.mkdir(exist_ok=True)


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


model = YOLO(str(MODEL_PATH))

result = model.predict(
    source=str(IMAGE_PATH),
    imgsz=640,
    verbose=False,
)[0]


semantic_mask = (
    result.semantic_mask.data
    .cpu()
    .numpy()
)

semantic_mask = np.squeeze(semantic_mask)

print("Mask shape:", semantic_mask.shape)

classes, counts = np.unique(
    semantic_mask,
    return_counts=True,
)

print("\nPredicted classes:")

for class_id, count in zip(classes, counts):

    percentage = (
        count / semantic_mask.size
    ) * 100

    print(
        f"{int(class_id):2d} | "
        f"{CLASS_NAMES[int(class_id)]:22s} | "
        f"{count:8d} pixels | "
        f"{percentage:6.2f}%"
    )


# ------------------------------------------------------------
# RESIZE MASK TO ORIGINAL IMAGE
# ------------------------------------------------------------

image = cv2.imread(
    str(IMAGE_PATH)
)

height, width = image.shape[:2]

mask = cv2.resize(
    semantic_mask.astype(np.uint8),
    (width, height),
    interpolation=cv2.INTER_NEAREST,
)


# ------------------------------------------------------------
# CREATE COLORED MASK
# ------------------------------------------------------------

colors = np.array([
    [0, 0, 0],        # Background
    [255, 0, 0],      # Building flooded
    [0, 255, 0],      # Building non-flooded
    [255, 100, 0],    # Road flooded
    [100, 100, 100],  # Road non-flooded
    [0, 0, 255],      # Water
    [0, 255, 255],    # Tree
    [255, 0, 255],    # Vehicle
    [255, 255, 0],    # Pool
    [0, 180, 0],      # Grass
], dtype=np.uint8)


colored_mask = colors[mask]


# ------------------------------------------------------------
# OVERLAY
# ------------------------------------------------------------

overlay = cv2.addWeighted(
    image,
    0.55,
    colored_mask,
    0.45,
    0,
)


# ------------------------------------------------------------
# SAVE
# ------------------------------------------------------------

mask_path = (
    OUTPUT_DIR / "predicted_mask.png"
)

overlay_path = (
    OUTPUT_DIR / "prediction_overlay.jpg"
)

cv2.imwrite(
    str(mask_path),
    colored_mask
)

cv2.imwrite(
    str(overlay_path),
    overlay
)

print("\nSaved:")
print(mask_path)
print(overlay_path)