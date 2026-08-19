from typing import Any, Literal

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

    bbox: list[float] = Field(
        min_length=4,
        max_length=4,
    )


class Finding(BaseModel):
    type: Literal[
        "BUILDING_DAMAGE",
        "ROAD_BLOCKAGE",
        "INFRASTRUCTURE_DAMAGE",
        "SERVICE_DISRUPTION",
    ]

    severity: (
        Literal[
            "LOW",
            "MODERATE",
            "SEVERE",
            "CRITICAL",
        ]
        | None
    ) = None

    title: str | None = None
    description: str | None = None

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

    bbox: list[float] | None = Field(
        default=None,
        min_length=4,
        max_length=4,
    )

    prediction: dict[str, Any]


class AnalyzeResponse(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True
    )

    image_id: str = Field(
        alias="imageId",
        min_length=1,
    )

    analysis_type: Literal[
        "GENERIC_OBJECT_DETECTION",
        "DISASTER_DAMAGE_ASSESSMENT",
    ] = Field(
        alias="analysisType"
    )

    model: ModelInfo

    processing_time_ms: float = Field(
        alias="processingTimeMs",
        ge=0,
    )

    detections: list[RawDetection] = Field(
        default_factory=list
    )

    findings: list[Finding] = Field(
        default_factory=list
    )
