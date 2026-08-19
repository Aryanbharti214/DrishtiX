from pydantic import BaseModel


class PreprocessingResponse(BaseModel):
    image_id: str
    original_width: int
    original_height: int
    processed_width: int
    processed_height: int
    channels: int
    color_space: str
    normalization: str
    dtype: str
    processed_path: str