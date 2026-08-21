# ============================================================
# PRIORITY / DECISION SUPPORT ENGINE
# ============================================================

BUILDING_WEIGHT = 0.50
ROAD_WEIGHT = 0.35
WATER_WEIGHT = 0.15


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_area(area_percentage: float) -> float:
    """
    Convert image-area percentage into a 0-100 impact score.

    30% or more is treated as maximum impact.
    """

    return min(
        (area_percentage / 30.0) * 100.0,
        100.0,
    )


# ============================================================
# FINDING HELPERS
# ============================================================

def get_area(findings, class_name: str) -> float:
    """
    Return area percentage for a particular class.
    """

    for finding in findings:

        if finding["type"] == class_name:

            return float(
                finding["area_percentage"]
            )

    return 0.0


# ============================================================
# IMPACT CATEGORY
# ============================================================

def get_impact_category(area_percentage: float) -> str:

    if area_percentage >= 30:
        return "severe"

    if area_percentage >= 15:
        return "high"

    if area_percentage >= 5:
        return "moderate"

    if area_percentage > 0:
        return "low"

    return "none"


# ============================================================
# RESPONSE PRIORITY
# ============================================================

def get_response_priority(score: float) -> str:

    if score >= 75:
        return "P1"

    if score >= 50:
        return "P2"

    if score >= 25:
        return "P3"

    return "P4"


# ============================================================
# RESPONSE LEVEL
# ============================================================

def get_priority_level(score: float) -> str:

    if score >= 75:
        return "critical"

    if score >= 50:
        return "high"

    if score >= 25:
        return "medium"

    return "low"


# ============================================================
# RECOMMENDED ACTION
# ============================================================

def generate_recommended_action(
    building_area: float,
    road_area: float,
    water_area: float,
    priority_level: str,
) -> str:

    # Critical building impact
    if building_area >= 30:

        return (
            "Prioritize emergency assessment of affected "
            "buildings and potential evacuation."
        )

    # High building + road impact
    if building_area >= 15 and road_area >= 15:

        return (
            "Prioritize affected buildings and assess "
            "road accessibility for emergency response."
        )

    # Significant road impact
    if road_area >= 15:

        return (
            "Assess road accessibility and prioritize "
            "alternative emergency access routes."
        )

    # Moderate building impact
    if building_area >= 5:

        return (
            "Inspect affected buildings and assess "
            "local evacuation requirements."
        )

    # Moderate road impact
    if road_area >= 5:

        return (
            "Inspect affected roads and monitor "
            "transport accessibility."
        )

    # Water only
    if water_area >= 5:

        return (
            "Monitor water extent and assess potential "
            "flood expansion."
        )

    return (
        "Continue monitoring; detected flood impact "
        "is currently limited."
    )


# ============================================================
# EXPLANATION
# ============================================================

def generate_reasons(
    building_area: float,
    road_area: float,
    water_area: float,
):

    reasons = []

    if building_area >= 30:

        reasons.append(
            f"{building_area:.2f}% of image area is "
            "classified as flooded building regions"
        )

    elif building_area >= 15:

        reasons.append(
            f"{building_area:.2f}% of image area shows "
            "high building-flood impact"
        )

    elif building_area >= 5:

        reasons.append(
            f"{building_area:.2f}% of image area shows "
            "moderate building-flood impact"
        )

    if road_area >= 30:

        reasons.append(
            f"{road_area:.2f}% of image area is "
            "classified as flooded road regions"
        )

    elif road_area >= 15:

        reasons.append(
            f"{road_area:.2f}% of image area shows "
            "high road-flood impact"
        )

    elif road_area >= 5:

        reasons.append(
            f"{road_area:.2f}% of image area shows "
            "moderate road-flood impact"
        )

    if water_area >= 15:

        reasons.append(
            f"{water_area:.2f}% of image area shows "
            "significant water extent"
        )

    elif water_area >= 5:

        reasons.append(
            f"{water_area:.2f}% of image area shows "
            "detectable water extent"
        )

    if not reasons:

        reasons.append(
            "Limited flood impact detected"
        )

    return reasons


# ============================================================
# MAIN PRIORITY ENGINE
# ============================================================

def calculate_priority(findings):

    # --------------------------------------------------------
    # Extract areas
    # --------------------------------------------------------

    building_area = get_area(
        findings,
        "Building-flooded",
    )

    road_area = get_area(
        findings,
        "Road-flooded",
    )

    water_area = get_area(
        findings,
        "Water",
    )

    # --------------------------------------------------------
    # Normalize
    # --------------------------------------------------------

    building_score = normalize_area(
        building_area
    )

    road_score = normalize_area(
        road_area
    )

    water_score = normalize_area(
        water_area
    )

    # --------------------------------------------------------
    # Weighted priority score
    # --------------------------------------------------------

    priority_score = (
        building_score * BUILDING_WEIGHT
        + road_score * ROAD_WEIGHT
        + water_score * WATER_WEIGHT
    )

    priority_score = round(
        priority_score,
        2,
    )

    # --------------------------------------------------------
    # Priority classification
    # --------------------------------------------------------

    priority_level = get_priority_level(
        priority_score
    )

    response_priority = get_response_priority(
        priority_score
    )

    # --------------------------------------------------------
    # Impact categories
    # --------------------------------------------------------

    building_impact = get_impact_category(
        building_area
    )

    road_impact = get_impact_category(
        road_area
    )

    water_impact = get_impact_category(
        water_area
    )

    # --------------------------------------------------------
    # Explanation
    # --------------------------------------------------------

    reasons = generate_reasons(
        building_area,
        road_area,
        water_area,
    )

    # --------------------------------------------------------
    # Recommended response
    # --------------------------------------------------------

    recommended_action = (
        generate_recommended_action(
            building_area,
            road_area,
            water_area,
            priority_level,
        )
    )

    # --------------------------------------------------------
    # Final result
    # --------------------------------------------------------

    return {

        "score": priority_score,

        "level": priority_level,

        "response_priority": response_priority,

        "impact": {

            "buildings": building_impact,

            "roads": road_impact,

            "water": water_impact,

        },

        "recommended_action":
            recommended_action,

        "reasons": reasons,

        "components": {

            "building_impact":
                round(
                    building_score,
                    2,
                ),

            "road_impact":
                round(
                    road_score,
                    2,
                ),

            "water_extent":
                round(
                    water_score,
                    2,
                ),

        },

    }