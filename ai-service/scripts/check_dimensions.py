from pathlib import Path
from PIL import Image
from collections import Counter


DATASET_ROOT = Path(r"D:\Drishtix\datasets\floodnet")

CATEGORIES = [
    "Flooded",
    "Non-Flooded",
]


def inspect():

    image_sizes = Counter()
    mask_sizes = Counter()
    mismatches = []

    total_pairs = 0

    for category in CATEGORIES:

        image_dir = (
            DATASET_ROOT
            / "Train"
            / "Labeled"
            / category
            / "image"
        )

        mask_dir = (
            DATASET_ROOT
            / "Train"
            / "Labeled"
            / category
            / "mask"
        )

        for image_path in image_dir.glob("*.jpg"):

            mask_path = (
                mask_dir
                / f"{image_path.stem}_lab.png"
            )

            if not mask_path.exists():
                continue

            total_pairs += 1

            image_size = Image.open(image_path).size
            mask_size = Image.open(mask_path).size

            image_sizes[image_size] += 1
            mask_sizes[mask_size] += 1

            if image_size != mask_size:

                mismatches.append(
                    {
                        "category": category,
                        "image": image_path.name,
                        "image_size": image_size,
                        "mask_size": mask_size,
                    }
                )

    print("=" * 60)
    print("FloodNet Dimension Analysis")
    print("=" * 60)

    print("\nTotal valid image-mask pairs:", total_pairs)

    print("\nImage dimensions:")
    for size, count in image_sizes.most_common():
        print(f"  {size}: {count}")

    print("\nMask dimensions:")
    for size, count in mask_sizes.most_common():
        print(f"  {size}: {count}")

    print("\nMismatched pairs:", len(mismatches))

    print("\nMismatch combinations:")
    combinations = Counter(
        (x["image_size"], x["mask_size"])
        for x in mismatches
    )

    for (image_size, mask_size), count in combinations.items():
        print(
            f"  Image {image_size} -> "
            f"Mask {mask_size}: {count}"
        )


if __name__ == "__main__":
    inspect()