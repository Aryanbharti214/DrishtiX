from typing import Any

from pydantic import BaseModel, Field


class Finding(BaseModel):
    type: str
    severity: str
    confidence: float = Field(ge=0.0, le=1.0)
    bbox: list[float] | None = None
    prediction: dict[str, Any]


class AnalyzeResponse(BaseModel):
    model_name: str
    model_version: str
    processing_time_ms: float
    findings: list[Finding]