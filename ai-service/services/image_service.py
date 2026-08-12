from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


async def save_uploaded_image(file: UploadFile):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(
            "Unsupported image type. "
            "Only JPEG, PNG and WebP images are allowed."
        )

    image_id = str(uuid4())

    original_filename = file.filename or "unknown"

    extension = Path(original_filename).suffix.lower()

    if not extension:
        extension = ".jpg"

    saved_filename = f"{image_id}{extension}"

    file_path = UPLOAD_DIR / saved_filename

    contents = await file.read()

    file_path.write_bytes(contents)

    return {
        "image_id": image_id,
        "filename": original_filename,
        "content_type": file.content_type,
        "size_bytes": len(contents),
        "source": "unknown",
        "status": "uploaded",
        "file_path": str(file_path),
    }