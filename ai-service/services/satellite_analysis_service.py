import time
from pathlib import Path

import cv2
import numpy as np
from fastapi import UploadFile


MODEL_NAME = "rgb-satellite-visual-analysis"
MODEL_VERSION = "1.1.0"


def _json_safe(value):
    """Convert response metadata to plain JSON-compatible Python values."""
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    return value


def _decode_image(image_bytes: bytes) -> np.ndarray:
    image = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("The uploaded image could not be read. Please use a clear JPG or PNG image.")
    return image


def _cloud_mask(image: np.ndarray) -> np.ndarray:
    blurred = cv2.GaussianBlur(image, (7, 7), 0)
    hsv = cv2.cvtColor(blurred, cv2.COLOR_BGR2HSV)
    _, saturation, value = cv2.split(hsv)
    gray = cv2.cvtColor(blurred, cv2.COLOR_BGR2GRAY).astype(np.float32)
    mean = cv2.boxFilter(gray, -1, (17, 17))
    square_mean = cv2.boxFilter(gray * gray, -1, (17, 17))
    local_std = np.sqrt(np.maximum(square_mean - mean * mean, 0))
    cloud = (
        ((value >= 225) & (saturation <= 70))
        | ((value >= 190) & (saturation <= 40) & (local_std <= 13.0))
    )
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    return cv2.dilate(cloud.astype(np.uint8) * 255, kernel)


def _content_mask(image: np.ndarray) -> np.ndarray:
    """Exclude uniform dark letterbox/padding connected to image borders."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray_float = gray.astype(np.float32)
    mean = cv2.boxFilter(gray_float, -1, (15, 15))
    square_mean = cv2.boxFilter(gray_float * gray_float, -1, (15, 15))
    local_std = np.sqrt(np.maximum(square_mean - mean * mean, 0))
    low_information = ((gray <= 60) & (local_std <= 3.0)).astype(np.uint8)
    count, labels = cv2.connectedComponents(low_information)
    excluded = np.zeros(gray.shape, dtype=bool)
    border_labels = np.unique(np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1])))
    for label in border_labels:
        if label == 0:
            continue
        region = labels == label
        if np.count_nonzero(region) >= gray.size * 0.01:
            excluded |= region
    return (~excluded).astype(np.uint8) * 255


def _vegetation_mask(image: np.ndarray) -> np.ndarray:
    blue, green, red = cv2.split(image.astype(np.float32))
    excess_green = 2.0 * green - red - blue
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    hue, saturation, value = cv2.split(hsv)
    green_dominant = (
        (excess_green >= 22)
        & (green >= red * 1.04)
        & (green >= blue * 1.03)
        & (value >= 25)
    )
    green_hue = (hue >= 32) & (hue <= 92) & (saturation >= 38) & (value >= 28)
    vegetation = (green_dominant | green_hue).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    return cv2.morphologyEx(vegetation, cv2.MORPH_CLOSE, kernel)


def _debris_assessment(image: np.ndarray, valid: np.ndarray | None = None) -> tuple[np.ndarray, bool, dict]:
    blurred = cv2.GaussianBlur(image, (5, 5), 0)
    hsv = cv2.cvtColor(blurred, cv2.COLOR_BGR2HSV)
    hue, saturation, value = cv2.split(hsv)
    gray = cv2.cvtColor(blurred, cv2.COLOR_BGR2GRAY).astype(np.float32)
    mean = cv2.boxFilter(gray, -1, (13, 13))
    square_mean = cv2.boxFilter(gray * gray, -1, (13, 13))
    local_std = np.sqrt(np.maximum(square_mean - mean * mean, 0))
    vegetation = _vegetation_mask(blurred) > 0
    cloud = _cloud_mask(blurred) > 0
    usable = (_content_mask(image) > 0) if valid is None else valid > 0

    neutral_rough = (saturation <= 62) & (value >= 48) & (value <= 218)
    earthy_rough = (hue >= 5) & (hue <= 32) & (saturation >= 22) & (saturation <= 115) & (value >= 45) & (value <= 205)
    # Texture rejects smooth concrete/roofs; coherence later rejects isolated rock.
    textured_surface = (local_std >= 5.5) & (local_std <= 42.0)
    candidate = (neutral_rough | earthy_rough) & textured_surface & ~vegetation & ~cloud & usable
    mask = candidate.astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    usable_count = max(1, int(np.count_nonzero(usable)))
    minimum = max(80, int(usable_count * 0.0025))
    cleaned = np.zeros_like(mask)
    regions = []
    for contour in cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
        area = cv2.contourArea(contour)
        if area >= minimum:
            regions.append(area)
            cv2.drawContours(cleaned, [contour], -1, 255, cv2.FILLED)
    cleaned[~usable] = 0
    coverage = np.count_nonzero(cleaned) / usable_count
    largest = max(regions, default=0.0) / usable_count
    cloud_fraction = np.count_nonzero(cloud & usable) / usable_count
    vegetation_fraction = np.count_nonzero(vegetation & usable) / usable_count
    supported = (
        coverage >= 0.28
        and largest >= 0.16
        and vegetation_fraction <= 0.18
        and cloud_fraction <= 0.55
    )
    return cleaned, supported, {
        "coverage": float(coverage),
        "largestRegionFraction": float(largest),
        "cloudFraction": float(cloud_fraction),
        "vegetationFraction": float(vegetation_fraction),
    }


def _water_assessment(image: np.ndarray, valid: np.ndarray | None = None) -> tuple[np.ndarray, bool, dict]:
    blurred = cv2.GaussianBlur(image, (5, 5), 0)
    hsv = cv2.cvtColor(blurred, cv2.COLOR_BGR2HSV)
    hue, saturation, value = cv2.split(hsv)
    blue, green, red = cv2.split(blurred.astype(np.int16))
    gray = cv2.cvtColor(blurred, cv2.COLOR_BGR2GRAY).astype(np.float32)
    local_mean = cv2.boxFilter(gray, -1, (11, 11))
    local_square = cv2.boxFilter(gray * gray, -1, (11, 11))
    local_std = np.sqrt(np.maximum(local_square - local_mean * local_mean, 0))
    gradient = cv2.magnitude(
        cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3),
        cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3),
    )

    vegetation = _vegetation_mask(blurred) > 0
    cloud = cv2.dilate(
        _cloud_mask(blurred),
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17)),
    ) > 0
    usable = np.ones(value.shape, dtype=bool) if valid is None else valid > 0
    smooth = (local_std <= 13.0) & (gradient <= 38.0)

    # Water must have chromatic evidence or be neutral, smooth and moderately dark.
    # Dark pixels alone are deliberately insufficient because forest/mountain shadow
    # was the dominant real-world false positive.
    blue_water = (
        (hue >= 88) & (hue <= 132) & (saturation >= 28) & (value >= 38) & (value <= 210)
        & ((blue - green >= 5) | (blue - red >= 14))
    )
    neutral_water = (
        (saturation <= 48) & (value >= 42) & (value <= 145) & smooth
        & (blue >= green - 6) & (green >= red - 8)
    )
    muddy_water = (
        (hue >= 7) & (hue <= 25) & (saturation >= 28) & (saturation <= 105)
        & (value >= 48) & (value <= 180) & smooth
    )
    raw = (blue_water | neutral_water | muddy_water) & ~vegetation & ~cloud & usable
    mask = raw.astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

    minimum = max(30, int(np.count_nonzero(usable) * 0.00035))
    cleaned = np.zeros_like(mask)
    for contour in cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
        if cv2.contourArea(contour) >= minimum:
            cv2.drawContours(cleaned, [contour], -1, 255, cv2.FILLED)
    cleaned[~usable] = 0
    regions = [cv2.contourArea(item) for item in cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]]

    usable_count = max(1, int(np.count_nonzero(usable)))
    raw_count = int(np.count_nonzero(raw))
    retained = np.count_nonzero(cleaned) / max(1, raw_count)
    cloud_fraction = np.count_nonzero(cloud & usable) / usable_count
    ambiguous_dark = (
        (value <= 95) & ~vegetation & ~cloud & ~raw & usable
    )
    ambiguous_fraction = np.count_nonzero(ambiguous_dark) / usable_count
    raw_fraction = raw_count / usable_count
    dominant_region = max(regions, default=0.0) / max(1, int(np.count_nonzero(cleaned)))
    reliable = (
        cloud_fraction <= 0.35
        and ambiguous_fraction <= 0.22
        and raw_fraction <= 0.38
        and (raw_fraction < 0.015 or retained >= 0.35)
        and (raw_fraction < 0.015 or dominant_region >= 0.30)
    )
    diagnostics = {
        "cloudFraction": float(cloud_fraction),
        "ambiguousDarkFraction": float(ambiguous_fraction),
        "candidateFraction": float(raw_fraction),
        "coherence": float(retained),
        "dominantRegion": float(dominant_region),
    }
    return cleaned, reliable, diagnostics


def _water_mask(image: np.ndarray) -> np.ndarray:
    return _water_assessment(image)[0]


def _percentage(mask: np.ndarray, valid: np.ndarray | None = None) -> float:
    if valid is None:
        valid = np.ones(mask.shape, dtype=np.uint8) * 255
    denominator = int(np.count_nonzero(valid))
    if denominator == 0:
        return 0.0
    return round(100.0 * np.count_nonzero((mask > 0) & (valid > 0)) / denominator, 2)


def _level_and_priority(score: float) -> tuple[str, str]:
    if score >= 45:
        return "CRITICAL", "P1"
    if score >= 25:
        return "HIGH", "P2"
    if score >= 10:
        return "MODERATE", "P3"
    return "LOW", "P4"


def _priority(score: float, level: str, priority: str, water: str, reasons: list[str]) -> dict:
    return {
        "score": round(min(100.0, score), 2),
        "level": level,
        "responsePriority": priority,
        "impact": {"buildings": "Not assessed", "roads": "Not assessed", "water": water},
        "recommendedAction": "Review this satellite assessment alongside field reports before taking action.",
        "reasons": reasons,
        "components": {"buildingImpact": 0.0, "roadImpact": 0.0, "waterExtent": round(score, 2)},
    }


def _finding(level: str, title: str, description: str, details: dict, confidence: float | None = None) -> list[dict]:
    if level not in {"MODERATE", "HIGH", "CRITICAL"}:
        return []
    severity = {
        "MODERATE": "MODERATE",
        "HIGH": "SEVERE",
        "CRITICAL": "CRITICAL",
    }[level]
    return [{
        "type": "SERVICE_DISRUPTION",
        "severity": severity,
        "title": title,
        "description": description,
        "confidence": round(float(confidence), 4) if confidence is not None else None,
        "prediction": {"source": "rgb_satellite_visual_analysis", **details},
    }]


def _save_overlay(image: np.ndarray, mask: np.ndarray, output_path: Path, color=(255, 170, 0)) -> None:
    tint = image.copy()
    tint[mask > 0] = color
    overlay = cv2.addWeighted(image, 0.68, tint, 0.32, 0)
    if not cv2.imwrite(str(output_path), overlay):
        raise ValueError("The analysis result image could not be prepared.")


def _align(before: np.ndarray, after: np.ndarray) -> tuple[np.ndarray, np.ndarray, str, float]:
    height, width = after.shape[:2]
    before_gray = cv2.cvtColor(before, cv2.COLOR_BGR2GRAY)
    after_gray = cv2.cvtColor(after, cv2.COLOR_BGR2GRAY)
    if before.shape[:2] == after.shape[:2] and float(np.mean(cv2.absdiff(before_gray, after_gray))) < 2.0:
        valid = cv2.bitwise_and(_content_mask(before), _content_mask(after))
        return before.copy(), valid, "IDENTITY", 1.0

    # ORB retained substantially more stable matches than SIFT on the real
    # cloudy Timure regression pair, while remaining available in base OpenCV.
    detector = cv2.ORB_create(nfeatures=8000, fastThreshold=7)
    norm = cv2.NORM_HAMMING
    method_name = "ORB"
    key_before, desc_before = detector.detectAndCompute(before_gray, None)
    key_after, desc_after = detector.detectAndCompute(after_gray, None)
    if desc_before is not None and desc_after is not None:
        pairs = cv2.BFMatcher(norm).knnMatch(desc_before, desc_after, k=2)
        good = [pair[0] for pair in pairs if len(pair) == 2 and pair[0].distance < 0.75 * pair[1].distance]
        if len(good) >= 16:
            source = np.float32([key_before[item.queryIdx].pt for item in good]).reshape(-1, 1, 2)
            target = np.float32([key_after[item.trainIdx].pt for item in good]).reshape(-1, 1, 2)
            transform, inliers = cv2.findHomography(source, target, cv2.RANSAC, 4.0)
            inlier_ratio = float(inliers.mean()) if inliers is not None else 0.0
            if transform is not None and inliers is not None and inlier_ratio >= 0.38:
                projected = cv2.perspectiveTransform(source[inliers.ravel() > 0], transform)
                errors = np.linalg.norm(projected - target[inliers.ravel() > 0], axis=2)
                reprojection = float(np.median(errors)) if errors.size else 999.0
                corners = np.float32([[[0, 0]], [[before.shape[1], 0]], [[before.shape[1], before.shape[0]]], [[0, before.shape[0]]]])
                warped_corners = cv2.perspectiveTransform(corners, transform).reshape(-1, 2)
                warped_area = abs(float(cv2.contourArea(warped_corners.astype(np.float32))))
                target_area = float(width * height)
                sane_transform = (
                    np.isfinite(warped_corners).all()
                    and 0.45 * target_area <= warped_area <= 2.2 * target_area
                    and reprojection <= 5.0
                )
                aligned = cv2.warpPerspective(before, transform, (width, height))
                valid = cv2.warpPerspective(
                    _content_mask(before),
                    transform,
                    (width, height),
                    flags=cv2.INTER_NEAREST,
                )
                valid = cv2.bitwise_and(valid, _content_mask(after))
                overlap = np.count_nonzero(valid) / target_area
                usable = valid > 0
                structural = 0.0
                if np.count_nonzero(usable):
                    old_edges = cv2.Canny(cv2.GaussianBlur(cv2.cvtColor(aligned, cv2.COLOR_BGR2GRAY), (5, 5), 0), 40, 120).astype(np.float32)
                    new_edges = cv2.Canny(cv2.GaussianBlur(after_gray, (5, 5), 0), 40, 120).astype(np.float32)
                    old_values = old_edges[usable]
                    new_values = new_edges[usable]
                    if old_values.std() > 0 and new_values.std() > 0:
                        structural = max(0.0, float(np.corrcoef(old_values, new_values)[0, 1]))
                quality = 0.50 * inlier_ratio + 0.25 * min(1.0, overlap) + 0.25 * structural
                feature_geometry_is_strong = inlier_ratio >= 0.50 and reprojection <= 3.0
                if sane_transform and overlap >= 0.58 and quality >= 0.38 and (structural >= 0.12 or feature_geometry_is_strong):
                    return aligned, valid, method_name, quality

    resized = cv2.resize(before, (width, height))
    warp = np.eye(2, 3, dtype=np.float32)
    try:
        score, warp = cv2.findTransformECC(
            after_gray.astype(np.float32) / 255.0,
            cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0,
            warp,
            cv2.MOTION_AFFINE,
            (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 120, 1e-5),
        )
        if score >= 0.78:
            aligned = cv2.warpAffine(resized, warp, (width, height), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP)
            valid = cv2.warpAffine(_content_mask(resized), warp, (width, height), flags=cv2.INTER_NEAREST | cv2.WARP_INVERSE_MAP)
            valid = cv2.bitwise_and(valid, _content_mask(after))
            overlap = np.count_nonzero(valid) / float(height * width)
            if overlap >= 0.65:
                return aligned, valid, "INTENSITY", float(score * overlap)
    except cv2.error:
        pass
    raise ValueError("The Before and After images could not be matched reliably. Please use images of the same area with a similar view.")


def _change_assessment(before: np.ndarray, after: np.ndarray, valid: np.ndarray) -> tuple[np.ndarray, np.ndarray, dict]:
    before_lab = cv2.cvtColor(before, cv2.COLOR_BGR2LAB).astype(np.float32)
    after_lab = cv2.cvtColor(after, cv2.COLOR_BGR2LAB).astype(np.float32)
    border_safe = cv2.erode(valid, np.ones((15, 15), np.uint8))
    clouds = cv2.dilate(
        cv2.bitwise_or(_cloud_mask(before), _cloud_mask(after)),
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)),
    )
    usable = (border_safe > 0) & (clouds == 0)
    if np.count_nonzero(usable) < 0.30 * valid.size:
        raise ValueError("The Before and After images could not be matched reliably. Please use images of the same area with a similar view.")

    for channel in range(3):
        old = before_lab[:, :, channel][usable]
        new = after_lab[:, :, channel][usable]
        if old.size:
            before_lab[:, :, channel] = (before_lab[:, :, channel] - old.mean()) * (new.std() / max(old.std(), 1.0)) + new.mean()

    normalized_before = np.clip(before_lab, 0, 255).astype(np.uint8)
    normalized_after = after_lab.astype(np.uint8)
    color_difference = np.mean(
        np.abs(normalized_before[:, :, 1:].astype(np.float32) - normalized_after[:, :, 1:].astype(np.float32)),
        axis=2,
    )
    old_gray = cv2.cvtColor(cv2.cvtColor(normalized_before, cv2.COLOR_LAB2BGR), cv2.COLOR_BGR2GRAY)
    new_gray = cv2.cvtColor(after, cv2.COLOR_BGR2GRAY)
    old_blur = cv2.GaussianBlur(old_gray, (9, 9), 0).astype(np.float32)
    new_blur = cv2.GaussianBlur(new_gray, (9, 9), 0).astype(np.float32)
    intensity_difference = np.abs(old_blur - new_blur)
    old_edges = cv2.Canny(old_gray, 45, 130).astype(np.float32)
    new_edges = cv2.Canny(new_gray, 45, 130).astype(np.float32)
    edge_difference = cv2.GaussianBlur(cv2.absdiff(old_edges, new_edges), (11, 11), 0)

    old_mean = cv2.boxFilter(old_blur, -1, (15, 15))
    new_mean = cv2.boxFilter(new_blur, -1, (15, 15))
    old_std = np.sqrt(np.maximum(cv2.boxFilter(old_blur * old_blur, -1, (15, 15)) - old_mean * old_mean, 0))
    new_std = np.sqrt(np.maximum(cv2.boxFilter(new_blur * new_blur, -1, (15, 15)) - new_mean * new_mean, 0))
    texture_difference = np.abs(old_std - new_std)

    score = 0.28 * color_difference + 0.30 * intensity_difference + 0.24 * edge_difference + 0.18 * texture_difference
    score = cv2.GaussianBlur(score, (11, 11), 0)
    values = score[usable]
    median = float(np.median(values))
    mad = float(np.median(np.abs(values - median)))
    robust_threshold = median + 2.4 * max(mad, 1.0)
    otsu_threshold = float(cv2.threshold(np.clip(values, 0, 255).astype(np.uint8), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[0])
    threshold = max(
        9.0,
        min(
            max(robust_threshold, otsu_threshold * 0.90),
            float(np.percentile(values, 85)),
        ),
    )
    mask = ((score >= threshold) & usable).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    after_debris, _, _ = _debris_assessment(after, usable.astype(np.uint8) * 255)
    vegetation_loss = (
        (_vegetation_mask(before) > 0)
        & (_vegetation_mask(after) == 0)
        & usable
    ).astype(np.uint8) * 255
    impact_context = cv2.bitwise_or(after_debris, vegetation_loss)
    impact_context = cv2.dilate(
        impact_context,
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19)),
    )
    mask = cv2.bitwise_and(mask, impact_context)
    # Grow only from high-confidence seeds into adjacent, independently
    # supported change pixels. This bridges corridor gaps without lowering the
    # global change threshold or admitting unrelated terrain.
    support_threshold = max(8.0, median + 1.65 * max(mad, 1.0))
    support = ((score >= support_threshold) & usable).astype(np.uint8) * 255
    support = cv2.bitwise_and(support, impact_context)
    corridor_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 17))
    grown = mask.copy()
    for _ in range(2):
        neighbors = cv2.dilate(grown, corridor_kernel)
        expanded = cv2.bitwise_and(neighbors, support)
        next_grown = cv2.bitwise_or(grown, expanded)
        if np.array_equal(next_grown, grown):
            break
        grown = next_grown
    mask = cv2.morphologyEx(grown, cv2.MORPH_CLOSE, corridor_kernel)
    usable_count = int(np.count_nonzero(usable))
    minimum = max(80, int(usable_count * 0.0025))
    cleaned = np.zeros_like(mask)
    for contour in cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
        if cv2.contourArea(contour) >= minimum:
            cv2.drawContours(cleaned, [contour], -1, 255, cv2.FILLED)
    cleaned[~usable] = 0
    components = [cv2.contourArea(item) for item in cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]]
    diagnostics = {
        "cloudFraction": 1.0 - usable_count / max(1, int(np.count_nonzero(border_safe))),
        "usableFraction": usable_count / float(valid.size),
        "separation": float((threshold - median) / max(mad, 1.0)),
        "largestRegionFraction": (max(components) / usable_count) if components else 0.0,
        "impactContextFraction": np.count_nonzero((cleaned > 0) & (impact_context > 0)) / max(1, usable_count),
    }
    return cleaned, usable.astype(np.uint8) * 255, diagnostics


def _change_mask(before: np.ndarray, after: np.ndarray, valid: np.ndarray) -> np.ndarray:
    return _change_assessment(before, after, valid)[0]


async def analyze_satellite_image(image: UploadFile, image_id: str, result_path: Path, before_image: UploadFile | None = None, analysis_mode: str = "SINGLE_IMAGE") -> dict:
    started = time.perf_counter()
    after = _decode_image(await image.read())
    if analysis_mode == "BEFORE_AFTER":
        if before_image is None:
            raise ValueError("Please upload both Before and After images.")
        before = _decode_image(await before_image.read())
        try:
            aligned, valid, method, match_score = _align(before, after)
            changes, usable, change_quality = _change_assessment(aligned, after, valid)
        except ValueError:
            analysis_mode = "AFTER_IMAGE_FALLBACK"
        if analysis_mode == "BEFORE_AFTER":
            area_changed = _percentage(changes, usable)
            before_water, before_reliable, _ = _water_assessment(aligned, usable)
            after_water, after_reliable, _ = _water_assessment(after, usable)
            water_reliable = before_reliable and after_reliable
            new_water = cv2.bitwise_and(after_water, cv2.bitwise_not(before_water))
            new_water[usable == 0] = 0
            water_increase = _percentage(new_water, usable) if water_reliable else None
            coherence = 100.0 * change_quality["largestRegionFraction"]
            score = min(100.0, area_changed * 1.8 + coherence * 0.8)
            if water_increase is not None:
                score = min(100.0, score + water_increase * 0.5)
            level, suggested = _level_and_priority(score)
            if match_score >= 0.70 and change_quality["usableFraction"] >= 0.72 and change_quality["cloudFraction"] <= 0.12 and change_quality["separation"] >= 3.0:
                confidence = "Good"
            elif match_score >= 0.42 and change_quality["usableFraction"] >= 0.50 and change_quality["cloudFraction"] <= 0.30:
                confidence = "Moderate"
            else:
                confidence = "Low"
            changed_fraction = max(area_changed / 100.0, 0.001)
            region_coherence = min(
                1.0,
                change_quality["largestRegionFraction"] / changed_fraction,
            )
            finding_confidence = float(np.clip(
                0.30 * match_score
                + 0.20 * change_quality["usableFraction"]
                + 0.15 * (1.0 - change_quality["cloudFraction"])
                + 0.20 * min(1.0, change_quality["separation"] / 4.0)
                + 0.15 * region_coherence,
                0.0,
                1.0,
            ))
            if area_changed >= 25 and water_increase is not None and water_increase >= 5:
                summary = "Large visual changes and increased water were detected after the event."
            elif area_changed >= 25 and water_increase is None:
                summary = "Major visual changes were detected, but water increase could not be estimated reliably."
            elif area_changed >= 25:
                summary = "Major visual changes were detected, with little visible increase in water."
            elif level == "HIGH":
                summary = "Significant coherent terrain and river-corridor changes were detected after the event."
            elif area_changed >= 10:
                summary = "Moderate visual changes were detected after the event."
            else:
                summary = "Only limited visual changes were detected between the images."
            _save_overlay(after, changes, result_path, (30, 30, 230))
            details = {
                "analysisMode": analysis_mode,
                "areaChanged": area_changed,
                "waterIncrease": water_increase,
                "impactLevel": level,
                "suggestedPriority": suggested,
                "aiConfidence": confidence,
            }
            findings = _finding(level, "Significant disaster-related terrain change detected", f"Approximately {area_changed:.2f}% of the comparable area changed. Responder review is required.", details, finding_confidence)
            satellite = {"mode": analysis_mode, "areaChanged": area_changed, "waterIncrease": water_increase, "impactLevel": level, "suggestedPriority": suggested, "aiConfidence": confidence, "summary": summary}
            water_text = f"+{water_increase:.2f}%" if water_increase is not None else "Unable to estimate reliably"
            priority = _priority(score, level, suggested, water_text, [summary])
    if analysis_mode != "BEFORE_AFTER":
        water, reliable, quality = _water_assessment(after)
        debris, debris_supported, debris_quality = _debris_assessment(after)
        visible_water = _percentage(water) if reliable else None
        if debris_supported:
            score = min(44.0, 18.0 + 85.0 * debris_quality["coverage"])
            level, suggested = _level_and_priority(score)
            confidence = "Moderate"
            summary = "A large coherent area of exposed gray/brown debris-like terrain is visible. This is an impact cue, not a confirmed flood extent."
            overlay = debris
            finding_confidence = float(np.clip(
                0.30 * (1.0 - debris_quality["cloudFraction"])
                + 0.30 * min(1.0, debris_quality["largestRegionFraction"] / max(debris_quality["coverage"], 0.001))
                + 0.25 * min(1.0, debris_quality["coverage"] / 0.50)
                + 0.15 * (1.0 - debris_quality["vegetationFraction"]),
                0.0,
                1.0,
            ))
        elif reliable:
            score = min(100.0, visible_water * 1.7)
            level, suggested = _level_and_priority(score)
            if quality["cloudFraction"] <= 0.10 and quality["ambiguousDarkFraction"] <= 0.08 and (quality["candidateFraction"] < 0.01 or quality["coherence"] >= 0.60):
                confidence = "Good"
            else:
                confidence = "Moderate"
            summary = "Single-image assessment shows visible conditions. Use Before & After for a stronger impact assessment."
            overlay = water
            finding_confidence = float(np.clip(
                0.25 * (1.0 - quality["cloudFraction"])
                + 0.20 * (1.0 - quality["ambiguousDarkFraction"])
                + 0.30 * quality["coherence"]
                + 0.25 * quality["dominantRegion"],
                0.0,
                1.0,
            ))
        else:
            score = 0.0
            level = "Needs review"
            suggested = None
            confidence = "Low"
            summary = "Visible water could not be estimated reliably in this image. Use Before & After or responder review."
            overlay = water
            finding_confidence = None
        _save_overlay(after, overlay, result_path, (30, 30, 230) if debris_supported else (255, 170, 0))
        details = {"analysisMode": analysis_mode, "visibleWater": visible_water, "debrisImpactCue": debris_supported}
        if debris_supported:
            findings = _finding(level, "Large debris-like terrain cue", "A large coherent exposed terrain area requires responder review; it is not treated as confirmed flood water.", details, finding_confidence)
        elif visible_water is not None:
            findings = _finding(level, "High regional flood concern", f"Water-like areas cover approximately {visible_water:.2f}% of this image. Responder review is required.", details, finding_confidence)
        else:
            findings = []
        satellite = {"mode": analysis_mode, "visibleWater": visible_water, "floodConcern": level, "impactLevel": level if debris_supported else None, "suggestedPriority": suggested, "aiConfidence": confidence, "summary": summary, "impactCue": "Debris-like terrain" if debris_supported else None}
        if analysis_mode == "AFTER_IMAGE_FALLBACK":
            satellite["comparisonMessage"] = "Direct comparison was not possible. Showing the After-image impact assessment instead."
        priority = _priority(score, level, suggested or "P4", f"{visible_water:.2f}% visible" if visible_water is not None else "Unable to estimate reliably", [summary])

    return _json_safe({"imageId": image_id, "analysisType": "SATELLITE_ASSESSMENT", "model": {"name": MODEL_NAME, "version": MODEL_VERSION}, "processingTimeMs": round((time.perf_counter() - started) * 1000, 2), "resultImage": f"/api/v1/analyze/{image_id}/result", "priority": priority, "detections": [], "findings": findings, "segmentationSummary": [], "satelliteAnalysis": satellite})
