from pathlib import Path

from PIL import Image
import numpy as np
import matplotlib.pyplot as plt


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


# Load
image = Image.open(image_path).convert("RGB")
mask = Image.open(mask_path)

print("Original image:", image.size)
print("Mask:", mask.size)


# Resize image ONLY for this alignment experiment
resized_image = image.resize(
    mask.size,
    Image.Resampling.LANCZOS
)


image_array = np.array(resized_image)
mask_array = np.array(mask)


# Create a simple binary overlay:
# all non-background mask pixels highlighted
binary_mask = mask_array != 0


overlay = image_array.copy()

# Red overlay on labeled regions
overlay[binary_mask] = (
    0.5 * overlay[binary_mask]
    + 0.5 * np.array([255, 0, 0])
).astype(np.uint8)


# Plot
fig, axes = plt.subplots(1, 3, figsize=(18, 6))


axes[0].imshow(resized_image)
axes[0].set_title("Resized Image")
axes[0].axis("off")


axes[1].imshow(mask_array)
axes[1].set_title("Ground Truth Mask")
axes[1].axis("off")


axes[2].imshow(overlay)
axes[2].set_title("Mask Overlay")
axes[2].axis("off")


plt.tight_layout()


output = Path("mismatch_6614_overlay.png")
plt.savefig(output, dpi=150)

print("Saved:", output)