from typing import Any

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class ModelInfo(BaseModel):
    name: str
    version: str


class RawDetection(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True
    )

    class_id: int = Field(
        alias="classId",
        ge=0,
    )

    class_name: str = Field(
        alias="className",
        min_length=1,
    )

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )

    bbox: list[float]


class Finding(BaseModel):
    type: str

    severity: str | None = None

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )

    latitude: float | None = Field(
        default=None,
        ge=-90,
        le=90,
    )

    longitude: float | None = Field(
        default=None,
        ge=-180,
        le=180,
    )

    bbox: list[float] | None = None

    prediction: dict[str, Any]


class AnalyzeResponse(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True
    )

    image_id: str = Field(
        alias="imageId"
    )

    analysis_type: str = Field(
        alias="analysisType"
    )

    model: ModelInfo

    processing_time_ms: float = Field(
        alias="processingTimeMs",
        ge=0,
    )

    detections: list[RawDetection]

    findings: list[Finding]