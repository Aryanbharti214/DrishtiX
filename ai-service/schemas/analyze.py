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


class PriorityImpact(BaseModel):

    buildings: str

    roads: str

    water: str


class PriorityComponents(BaseModel):

    building_impact: float

    road_impact: float

    water_extent: float


class PriorityResult(BaseModel):

    score: float

    level: str

    response_priority: str

    impact: PriorityImpact

    recommended_action: str

    reasons: list[str]

    components: PriorityComponents


class AnalyzeResponse(BaseModel):

    model_name: str

    model_version: str

    processing_time_ms: float

    result_image: str

    priority: PriorityResult

    findings: list[Finding]