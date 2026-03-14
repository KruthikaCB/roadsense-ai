def calculate_traffic_impact(severity, road_type="main"):
    """
    Calculates traffic impact caused by a pothole.
    """

    severity_score = {
        "LOW": 1,
        "MEDIUM": 2,
        "HIGH": 3,
        "CRITICAL": 4
    }

    road_multiplier = {
        "street": 1,
        "main": 2,
        "highway": 3
    }

    base_score = severity_score.get(severity, 1)

    multiplier = road_multiplier.get(road_type, 1)

    impact_score = base_score * multiplier

    delay_minutes = impact_score * 2

    return {
        "impact_score": impact_score,
        "estimated_delay": delay_minutes
    }