import asyncio
import sys
import tempfile
from io import BytesIO
from pathlib import Path

import cv2
import numpy as np
from fastapi import UploadFile


ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from schemas.analyze import AnalyzeResponse  # noqa: E402
from services.satellite_analysis_service import (  # noqa: E402
    _align,
    _change_mask,
    _finding,
    _json_safe,
    _percentage,
    _water_assessment,
    analyze_satellite_image,
)


def assert_no_numpy_values(value) -> None:
    if isinstance(value, (np.generic, np.ndarray)):
        raise AssertionError(f"NumPy value leaked into API response: {type(value)!r}")
    if isinstance(value, dict):
        for item in value.values():
            assert_no_numpy_values(item)
    elif isinstance(value, (list, tuple)):
        for item in value:
            assert_no_numpy_values(item)


async def main() -> None:
    sanitized_probe = _json_safe({
        "bool": np.bool_(True),
        "integer": np.int64(7),
        "floating": np.float64(2.5),
        "array": np.array([1, 2], dtype=np.int32),
        "tuple": (np.bool_(False),),
    })
    assert_no_numpy_values(sanitized_probe)
    moderate_findings = _finding(
        "MODERATE",
        "Significant disaster-related terrain change detected",
        "Responder review is required.",
        {"analysisMode": "BEFORE_AFTER", "areaChanged": 12.5},
        0.72,
    )
    assert len(moderate_findings) == 1
    assert moderate_findings[0]["severity"] == "MODERATE"
    assert moderate_findings[0]["confidence"] == 0.72

    image_path = ROOT / "test.jpg"
    image = cv2.imread(str(image_path))
    if image is None:
        raise RuntimeError("test.jpg could not be read")

    aligned, valid, identity_method, _ = _align(image, image.copy())
    identical = _percentage(_change_mask(aligned, image, valid), valid)

    changed_image = image.copy()
    height, width = changed_image.shape[:2]
    cv2.rectangle(
        changed_image,
        (width // 4, height // 4),
        (3 * width // 4, 3 * height // 4),
        (0, 0, 255),
        -1,
    )
    aligned_changed, changed_valid, changed_method, _ = _align(image, changed_image)
    changed = _percentage(
        _change_mask(aligned_changed, changed_image, changed_valid),
        changed_valid,
    )

    assert identical <= 1.0
    assert changed > identical + 5.0

    shift = np.float32([[1, 0, 8], [0, 1, 6]])
    shifted_image = cv2.warpAffine(
        image,
        shift,
        (width, height),
        borderMode=cv2.BORDER_REFLECT,
    )
    aligned_shifted, shifted_valid, shifted_method, _ = _align(image, shifted_image)
    shifted = _percentage(
        _change_mask(aligned_shifted, shifted_image, shifted_valid),
        shifted_valid,
    )
    assert shifted <= 2.0

    forest_like = np.zeros((300, 400, 3), dtype=np.uint8)
    forest_like[:] = (38, 82, 35)
    cv2.randn(forest_like, (38, 82, 35), (7, 10, 7))
    forest_water, _, _ = _water_assessment(forest_like)
    forest_water_percentage = _percentage(forest_water)
    assert forest_water_percentage <= 1.0

    image_bytes = image_path.read_bytes()
    with tempfile.TemporaryDirectory() as folder:
        result = await analyze_satellite_image(
            image=UploadFile(file=BytesIO(image_bytes), filename="satellite.jpg"),
            image_id="satellite-contract-test",
            result_path=Path(folder) / "result.jpg",
        )
        assert_no_numpy_values(result)
        AnalyzeResponse.model_validate(result).model_dump_json(
            by_alias=True,
            exclude_none=True,
        )
        pair_result = await analyze_satellite_image(
            image=UploadFile(file=BytesIO(image_bytes), filename="after.jpg"),
            image_id="satellite-pair-contract-test",
            result_path=Path(folder) / "pair-result.jpg",
            before_image=UploadFile(file=BytesIO(image_bytes), filename="before.jpg"),
            analysis_mode="BEFORE_AFTER",
        )
        assert_no_numpy_values(pair_result)
        AnalyzeResponse.model_validate(pair_result).model_dump_json(
            by_alias=True,
            exclude_none=True,
        )
        assert pair_result["satelliteAnalysis"]["areaChanged"] <= 1.0

    print({
        "identicalAreaChanged": identical,
        "changedAreaChanged": changed,
        "identityAlignment": identity_method,
        "changedAlignment": changed_method,
        "shiftedAreaChanged": shifted,
        "shiftedAlignment": shifted_method,
        "forestLikeVisibleWater": forest_water_percentage,
        "responseContractValid": True,
        "responseSerializationValid": True,
        "moderateSatelliteFindingValid": True,
    })


if __name__ == "__main__":
    asyncio.run(main())
