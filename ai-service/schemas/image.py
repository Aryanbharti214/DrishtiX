from pydantic import BaseModel


class ImageUploadResponse(BaseModel):
    image_id: str
    filename: str
    content_type: str
    size_bytes: int
    source: str
    status: str