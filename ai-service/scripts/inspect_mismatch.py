from pathlib import Path
from PIL import Image
import numpy as np


DATASET_ROOT = Path(r"D:\Drishtix\datasets\floodnet")

image_path = (
    DATASET_ROOT
    / "Train"
    / "Labeled"
    / "Flooded"
    / "image"
    / "6614.jpg"
)

mask_path = (
    DATASET_ROOT
    / "Train"
    / "Labeled"
    / "Flooded"
    / "mask"
    / "6614_lab.png"
)

image = Image.open(image_path)
mask = Image.open(mask_path)

print("Image size:", image.size)
print("Mask size:", mask.size)

mask_array = np.array(mask)

print("Mask classes:", np.unique(mask_array))