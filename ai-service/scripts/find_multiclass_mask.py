from pathlib import Path

import numpy as np
from PIL import Image


DATASET_ROOT = Path(
    r"D:\Drishtix\datasets\floodnet"
)

MASK_DIRECTORIES = [
    DATASET_ROOT
    / "Train"
    / "Labeled"
    / "Flooded"
    / "mask",

    DATASET_ROOT
    / "Train"
    / "Labeled"
    / "Non-Flooded"
    / "mask",
]


for directory in MASK_DIRECTORIES:

    for mask_path in directory.glob("*_lab.png"):

        mask = np.array(
            Image.open(mask_path)
        )

        unique_classes = np.unique(mask)

        if len(unique_classes) >= 4:

            print(
                f"Found: {mask_path}"
            )

            print(
                "Classes:",
                unique_classes.tolist()
            )

            print(
                "Image ID:",
                mask_path.stem.replace(
                    "_lab",
                    ""
                )
            )

            raise SystemExit


print(
    "No mask containing 4 or more classes was found."
)