import math


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two GPS coordinates in meters.
    """

    R = 6371000  # Earth's radius in meters

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)

    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c

    return distance


def is_duplicate(new_lat, new_lon, existing_reports):
    """
    Check if a pothole already exists within 50 meters.
    """

    for report in existing_reports:

        distance = calculate_distance(
            new_lat,
            new_lon,
            report["latitude"],
            report["longitude"]
        )

        if distance < 50:
            return True

    return False