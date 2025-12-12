import requests
import math
import os
from typing import Tuple, Optional

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth using Haversine formula
    
    Args:
        lat1, lon1: Latitude and longitude of first point
        lat2, lon2: Latitude and longitude of second point
    
    Returns:
        Distance in kilometers (float)
    """
    # Convert latitude and longitude from degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of Earth in kilometers
    r = 6371
    
    return c * r

def get_osrm_distance(start_lat: float, start_lon: float, end_lat: float, end_lon: float) -> Optional[float]:
    """
    Calculate driving distance using OSRM (Open Source Routing Machine)
    
    OSRM provides real-world routing distances considering actual roads,
    traffic restrictions, and optimal paths - much more accurate than straight-line distance.
    
    Args:
        start_lat, start_lon: Starting coordinates
        end_lat, end_lon: Destination coordinates
    
    Returns:
        Distance in kilometers (float) or None if OSRM fails
    """
    # Get OSRM base URL from environment or use public demo server
    osrm_base_url = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org")
    
    # Build OSRM route API URL
    # Format: /route/v1/driving/lon1,lat1;lon2,lat2?overview=false&alternatives=false&steps=false
    url = f"{osrm_base_url}/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}"
    
    # Parameters to minimize response size and get only distance
    params = {
        "overview": "false",      # Don't return route geometry
        "alternatives": "false",  # Don't return alternative routes
        "steps": "false",        # Don't return turn-by-turn directions
        "annotations": "false"   # Don't return additional annotations
    }
    
    try:
        print(f"OSRM: Calculating route from ({start_lat}, {start_lon}) to ({end_lat}, {end_lon})")
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Check if OSRM found a valid route
        if data.get("code") == "Ok" and data.get("routes"):
            # Extract distance in meters from first route
            distance_meters = data["routes"][0]["distance"]
            distance_km = distance_meters / 1000.0
            
            print(f"OSRM: Route distance = {distance_km:.1f} km")
            return round(distance_km, 1)
        else:
            print(f"OSRM: No route found - {data.get('message', 'Unknown error')}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"OSRM: Network error - {str(e)}")
        return None
    except (KeyError, ValueError, TypeError) as e:
        print(f"OSRM: Response parsing error - {str(e)}")
        return None
    except Exception as e:
        print(f"OSRM: Unexpected error - {str(e)}")
        return None

def calculate_distance(start_lat: float, start_lon: float, end_lat: float, end_lon: float) -> float:
    """
    Calculate distance between two points with OSRM fallback to Haversine
    
    This function first tries to get real driving distance from OSRM.
    If OSRM fails (network issues, no route found, etc.), it falls back
    to straight-line Haversine distance calculation.
    
    Args:
        start_lat, start_lon: Starting coordinates
        end_lat, end_lon: Destination coordinates
    
    Returns:
        Distance in kilometers (float)
    """
    # Try OSRM first for real driving distance
    osrm_distance = get_osrm_distance(start_lat, start_lon, end_lat, end_lon)
    
    if osrm_distance is not None:
        return osrm_distance
    
    # Fallback to Haversine straight-line distance
    print("OSRM failed, using Haversine fallback")
    haversine_dist = haversine_distance(start_lat, start_lon, end_lat, end_lon)
    return round(haversine_dist, 1)