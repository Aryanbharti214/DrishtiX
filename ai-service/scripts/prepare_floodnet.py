from pathlib import Path
from collections import Counter
import random
import shutil

import numpy as np
from PIL import Image


SOURCE = Path(r"D:\Drishtix\datasets\floodnet")
OUTPUT = Path(r"D:\Drishtix\datasets\floodnet_prepared")

SEED = 42
VAL_RATIO = 0.20

CLASSES = {
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


def collect_pairs():
    pairs = []

    for category in ["Flooded", "Non-Flooded"]:

        image_dir = (
            SOURCE
            / "Train"
            / "Labeled"
            / category
            / "image"
        )

        mask_dir = (
            SOURCE
            / "Train"
            / "Labeled"
            / category
            / "mask"
        )

        for image_path in sorted(image_dir.glob("*.jpg")):

            mask_path = (
                mask_dir
                / f"{image_path.stem}_lab.png"
            )

            if not mask_path.exists():
                print("Missing mask:", image_path)
                continue

            mask = np.array(Image.open(mask_path))

            classes_present = set(
                np.unique(mask).tolist()
            )

            pairs.append({
                "id": image_path.stem,
                "category": category,
                "image": image_path,
                "mask": mask_path,
                "classes": classes_present,
            })

    return pairs


def make_split(pairs):
    random.seed(SEED)

    target_val = round(
        len(pairs) * VAL_RATIO
    )

    # Start with samples containing rare classes.
    class_frequency = Counter()

    for pair in pairs:
        for cls in pair["classes"]:
            class_frequency[cls] += 1

    remaining = pairs.copy()
    validation = []

    # Prioritize rare semantic classes.
    remaining.sort(
        key=lambda p: min(
            class_frequency[c]
            for c in p["classes"]
        )
    )

    # First ensure every class that exists gets a chance
    # to appear in validation.
    covered = set()

    for pair in remaining[:]:

        new_classes = pair["classes"] - covered

        if new_classes:
            validation.append(pair)
            covered.update(pair["classes"])
            remaining.remove(pair)

        if len(validation) >= target_val:
            break

    # Fill remaining validation slots randomly,
    # while keeping the split reproducible.
    random.shuffle(remaining)

    while len(validation) < target_val:
        validation.append(
            remaining.pop()
        )

    validation_ids = {
        pair["id"]
        for pair in validation
    }

    train = [
        pair
        for pair in pairs
        if pair["id"] not in validation_ids
    ]

    return train, validation


def prepare_pair(pair, split):

    output_image_dir = (
        OUTPUT
        / "images"
        / split
    )

    output_mask_dir = (
        OUTPUT
        / "masks"
        / split
    )

    output_image_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_mask_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    image = Image.open(
        pair["image"]
    ).convert("RGB")

    mask = Image.open(
        pair["mask"]
    )

    target_size = mask.size

    # Only the 59 mismatched images need
    # spatial alignment to their masks.
    if image.size != target_size:

        print(
            f"Resizing {pair['id']}: "
            f"{image.size} -> {target_size}"
        )

        image = image.resize(
            target_size,
            Image.Resampling.LANCZOS,
        )

    output_image = (
        output_image_dir
        / f"{pair['id']}.jpg"
    )

    output_mask = (
        output_mask_dir
        / f"{pair['id']}.png"
    )

    image.save(
        output_image,
        quality=95,
    )

    # CRITICAL:
    # segmentation masks use nearest-neighbor.
    mask.save(output_mask)


def write_yaml():

    yaml_content = f"""path: {OUTPUT.as_posix()}

train: images/train
val: images/val

masks_dir: masks

names:
  0: Background
  1: Building-flooded
  2: Building-non-flooded
  3: Road-flooded
  4: Road-non-flooded
  5: Water
  6: Tree
  7: Vehicle
  8: Pool
  9: Grass
"""

    yaml_path = OUTPUT / "floodnet.yaml"

    yaml_path.write_text(
        yaml_content,
        encoding="utf-8",
    )

    print("\nYAML written:", yaml_path)


def inspect_split(name, pairs):

    class_counts = Counter()

    for pair in pairs:
        for cls in pair["classes"]:
            class_counts[cls] += 1

    print(f"\n{name}: {len(pairs)} images")

    for cls in sorted(CLASSES):
        print(
            f"  {cls}: "
            f"{CLASSES[cls]:<24} "
            f"{class_counts[cls]}"
        )


def main():

    if OUTPUT.exists():

        print(
            f"ERROR: {OUTPUT} already exists."
        )

        print(
            "Delete it manually if you want "
            "to rebuild the dataset."
        )

        return

    print("Collecting FloodNet pairs...")

    pairs = collect_pairs()

    print(
        f"Total pairs collected: {len(pairs)}"
    )

    if len(pairs) != 398:

        print(
            "WARNING: expected 398 pairs."
        )

    train, val = make_split(pairs)

    print(
        f"\nTrain: {len(train)}"
    )

    print(
        f"Validation: {len(val)}"
    )

    inspect_split(
        "TRAIN",
        train,
    )

    inspect_split(
        "VALIDATION",
        val,
    )

    print("\nPreparing TRAIN...")

    for pair in train:
        prepare_pair(
            pair,
            "train",
        )

    print("\nPreparing VALIDATION...")

    for pair in val:
        prepare_pair(
            pair,
            "val",
        )

    write_yaml()

    print("\n================================")
    print("FloodNet preparation complete")
    print("================================")
    print("Output:", OUTPUT)


if __name__ == "__main__":
    main()