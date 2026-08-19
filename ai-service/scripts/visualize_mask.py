from pathlib import Path

import numpy as np
from PIL import Image


DATASET_ROOT = Path(
    r"D:\Drishtix\datasets\floodnet"
)

IMAGE_PATH = (
    DATASET_ROOT
    / "Train"
    / "Labeled"
    / "Flooded"
    / "image"
    / "6279.jpg"
)

MASK_PATH = (
    DATASET_ROOT
    / "Train"
    / "Labeled"
    / "Flooded"
    / "mask"
    / "6279_lab.png"
)

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


# RGB colors used only for visualizing the mask.
CLASS_COLORS = {
    0: (0, 0, 0),
    1: (255, 0, 0),
    2: (255, 180, 180),
    3: (255, 255, 0),
    4: (180, 180, 0),
    5: (0, 120, 255),
    6: (0, 180, 0),
    7: (255, 120, 0),
    8: (180, 0, 255),
    9: (100, 70, 30),
}


def create_colored_mask(mask):
    height, width = mask.shape

    colored = np.zeros(
        (height, width, 3),
        dtype=np.uint8,
    )

    for class_id, color in CLASS_COLORS.items():
        colored[mask == class_id] = color

    return colored


def main():

    image = Image.open(IMAGE_PATH).convert("RGB")
    mask = np.array(
        Image.open(MASK_PATH)
    )

    colored_mask = create_colored_mask(mask)

    colored_mask_image = Image.fromarray(
        colored_mask
    )

    # Blend original image and segmentation mask.
    overlay = Image.blend(
        image,
        colored_mask_image,
        alpha=0.45,
    )

    image.save(
        OUTPUT_DIR / "original.jpg"
    )

    colored_mask_image.save(
        OUTPUT_DIR / "mask_colored.png"
    )

    overlay.save(
        OUTPUT_DIR / "overlay.jpg"
    )

    print("Visualization complete.")

    print(
        f"Original image: {image.size}"
    )

    print(
        f"Mask shape: {mask.shape}"
    )

    print("\nClasses present:")

    for class_id in np.unique(mask):

        print(
            f"{class_id}: "
            f"{CLASS_NAMES[int(class_id)]}"
        )

    print(
        f"\nOutput directory: "
        f"{OUTPUT_DIR.resolve()}"
    )


if __name__ == "__main__":
    main()