from typing import Any

from pydantic import BaseModel, Field


class Finding(BaseModel):

    type: str

    severity: str

    pixel_count: int = Field(
        ge=0
    )

    area_percentage: float = Field(
        ge=0.0,
        le=100.0,
    )

    bbox: list[float] | None = None

    prediction: dict[str, Any]


class AnalyzeResponse(BaseModel):

    model_name: str

    model_version: str

    processing_time_ms: float

    findings: list[Finding]