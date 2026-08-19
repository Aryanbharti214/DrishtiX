from pathlib import Path
from uuid import uuid4
from io import BytesIO

from fastapi import UploadFile
from PIL import Image


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


async def save_uploaded_image(file: UploadFile):

    # -------------------------
    # 1. Validate content type
    # -------------------------

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(
            "Unsupported image type. "
            "Only JPEG, PNG and WebP images are allowed."
        )

    # -------------------------
    # 2. Read file
    # -------------------------

    contents = await file.read()

    if not contents:
        raise ValueError("Uploaded image is empty.")

    # -------------------------
    # 3. Validate file size
    # -------------------------

    if len(contents) > MAX_FILE_SIZE:
        raise ValueError(
            "Image size exceeds the 10 MB limit."
        )

    # -------------------------
    # 4. Validate actual image
    # -------------------------

    try:
        image = Image.open(BytesIO(contents))
        image.verify()
    except Exception:
        raise ValueError(
            "Uploaded file is not a valid image."
        )

    # -------------------------
    # 5. Validate extension
    # -------------------------

    original_filename = file.filename or "unknown"

    extension = Path(
        original_filename
    ).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError(
            "Unsupported image extension."
        )

    # -------------------------
    # 6. Generate image ID
    # -------------------------

    image_id = str(uuid4())

    saved_filename = (
        f"{image_id}{extension}"
    )

    file_path = UPLOAD_DIR / saved_filename

    # -------------------------
    # 7. Save image
    # -------------------------

    file_path.write_bytes(contents)

    # -------------------------
    # 8. Return metadata
    # -------------------------

    return {
        "image_id": image_id,
        "filename": original_filename,
        "content_type": file.content_type,
        "size_bytes": len(contents),
        "source": "unknown",
        "status": "uploaded",
        "file_path": str(file_path),
    }