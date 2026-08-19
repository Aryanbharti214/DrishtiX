from pathlib import Path
from PIL import Image


DATASET = Path(r"D:\Drishtix\datasets\floodnet_prepared")


def fix_split(split):

    image_dir = DATASET / "images" / split
    mask_dir = DATASET / "masks" / split

    fixed = 0
    already_correct = 0
    missing = 0

    for image_path in image_dir.glob("*.jpg"):

        mask_path = mask_dir / f"{image_path.stem}.png"

        if not mask_path.exists():
            print("Missing mask:", image_path.name)
            missing += 1
            continue

        with Image.open(image_path) as image:
            image_size = image.size

        with Image.open(mask_path) as mask:
            mask_size = mask.size

        if image_size == mask_size:
            already_correct += 1
            continue

        print(
            f"[{split}] Resizing {image_path.name}: "
            f"{image_size} -> {mask_size}"
        )

        # Load image
        image = Image.open(image_path).convert("RGB")

        # Resize image to EXACT mask dimensions.
        image = image.resize(
            mask_size,
            Image.Resampling.LANCZOS
        )

        # Save back to prepared dataset.
        image.save(
            image_path,
            quality=95
        )

        fixed += 1

    print()
    print(f"{split.upper()} RESULTS")
    print("--------------------")
    print("Fixed:", fixed)
    print("Already correct:", already_correct)
    print("Missing:", missing)

    return fixed


def main():

    print("=" * 60)
    print("FloodNet Prepared Dataset Dimension Repair")
    print("=" * 60)

    train_fixed = fix_split("train")
    val_fixed = fix_split("val")

    print()
    print("=" * 60)
    print("TOTAL FIXED:", train_fixed + val_fixed)
    print("=" * 60)


if __name__ == "__main__":
    main()