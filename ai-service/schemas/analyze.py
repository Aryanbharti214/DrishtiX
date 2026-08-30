from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class ModelInfo(BaseModel):
    name: str
    version: str


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

    confidence: float | None = Field(
        default=None,
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


class SegmentationFinding(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True
    )

    type: str
    severity: str

    pixel_count: int = Field(
        alias="pixelCount",
        ge=0,
    )

    area_percentage: float = Field(
        alias="areaPercentage",
        ge=0.0,
        le=100.0,
    )

    bbox: list[float] | None = None

    prediction: dict[str, Any]


class PriorityImpact(BaseModel):
    buildings: str
    roads: str
    water: str


class PriorityComponents(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True
    )

    building_impact: float = Field(
        alias="buildingImpact"
    )

    road_impact: float = Field(
        alias="roadImpact"
    )

    water_extent: float = Field(
        alias="waterExtent"
    )


class PriorityResult(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True
    )

    score: float

    level: str

    response_priority: str = Field(
        alias="responsePriority"
    )

    impact: PriorityImpact

    recommended_action: str = Field(
        alias="recommendedAction"
    )

    reasons: list[str]

    components: PriorityComponents


class AnalyzeResponse(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True
    )

    image_id: str = Field(
        alias="imageId"
    )

    analysis_type: Literal[
        "DISASTER_DAMAGE_ASSESSMENT",
        "SATELLITE_ASSESSMENT",
    ] = Field(
        alias="analysisType"
    )

    model: ModelInfo

    processing_time_ms: float = Field(
        alias="processingTimeMs",
        ge=0,
    )

    result_image: str = Field(
        alias="resultImage"
    )

    priority: PriorityResult

    detections: list[dict[str, Any]] = Field(
        default_factory=list
    )

    findings: list[Finding] = Field(
        default_factory=list
    )

    segmentation_summary: list[
        SegmentationFinding
    ] = Field(
        alias="segmentationSummary",
        default_factory=list,
    )

    satellite_analysis: dict[str, Any] | None = Field(
        alias="satelliteAnalysis",
        default=None,
    )
