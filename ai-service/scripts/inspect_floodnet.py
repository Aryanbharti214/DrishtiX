from pathlib import Path

import numpy as np
from PIL import Image


DATASET_ROOT = Path(
    r"D:\Drishtix\datasets\floodnet"
)

MASK_DIRECTORIES = [
    DATASET_ROOT / "Train" / "Labeled" / "Flooded" / "mask",
    DATASET_ROOT / "Train" / "Labeled" / "Non-Flooded" / "mask",
]


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


def inspect_masks():
    pixel_counts = {
        class_id: 0
        for class_id in CLASS_NAMES
    }

    mask_counts = {
        class_id: 0
        for class_id in CLASS_NAMES
    }

    total_masks = 0

    for mask_directory in MASK_DIRECTORIES:

        print(f"\nInspecting: {mask_directory}")

        for mask_path in mask_directory.glob("*_lab.png"):

            total_masks += 1

            mask = np.array(
                Image.open(mask_path)
            )

            unique_values = np.unique(mask)

            for value in unique_values:

                class_id = int(value)

                if class_id not in CLASS_NAMES:
                    print(
                        f"WARNING: Unknown class "
                        f"{class_id} in {mask_path.name}"
                    )
                    continue

                mask_counts[class_id] += 1

                pixel_counts[class_id] += int(
                    np.sum(mask == class_id)
                )

    print("\n==============================")
    print("FloodNet Mask Inspection")
    print("==============================")

    print(f"\nTotal masks: {total_masks}")

    print("\nMask occurrence:")
    for class_id, count in mask_counts.items():

        print(
            f"{class_id}: "
            f"{CLASS_NAMES[class_id]:25} "
            f"{count}"
        )

    print("\nPixel distribution:")
    for class_id, count in pixel_counts.items():

        print(
            f"{class_id}: "
            f"{CLASS_NAMES[class_id]:25} "
            f"{count:,}"
        )


if __name__ == "__main__":
    inspect_masks()