import requests
import json
from typing import List, Dict, Any
from .osrm_distance import calculate_distance

def find_nearby_facilities(lat: float, lon: float, radius_km: float = 2.5) -> Dict[str, Any]:
    """
    Find nearby medical facilities optimized for citizen dashboard
    
    Fast search with haversine distance only - no OSRM routing for speed.
    Limited to 40 facilities within 2.5km for instant results.
    
    Args:
        lat: User's latitude
        lon: User's longitude  
        radius_km: Search radius in kilometers (default 2.5, max 3.0)
    
    Returns:
        Dict containing user_location, radius_km, and sorted facilities list
    """
    # Allow up to 5km for fallback searches
    radius_km = min(radius_km, 5.0)
    
    print(f"Fast Overpass: Searching for facilities within {radius_km}km of ({lat}, {lon})")
    
    # Convert radius from km to meters for Overpass API
    radius_meters = int(radius_km * 1000)
    
    # Overpass API endpoint
    overpass_url = "https://overpass-api.de/api/interpreter"
    
    # Simplified Overpass query for speed - only essential facility types
    overpass_query = f"""
    [out:json][timeout:15];
    (
      node["amenity"="hospital"](around:{radius_meters},{lat},{lon});
      node["amenity"="clinic"](around:{radius_meters},{lat},{lon});
      node["amenity"="pharmacy"](around:{radius_meters},{lat},{lon});
      way["amenity"="hospital"](around:{radius_meters},{lat},{lon});
      way["amenity"="clinic"](around:{radius_meters},{lat},{lon});
    );
    out center;
    """
    
    try:
        print("Overpass: Sending query to OpenStreetMap...")
        
        response = requests.post(
            overpass_url,
            data=overpass_query,
            headers={'Content-Type': 'text/plain'},
            timeout=20
        )
        response.raise_for_status()
        
        data = response.json()
        elements = data.get('elements', [])
        
        print(f"Overpass: Found {len(elements)} raw facilities")
        
        # Process facilities with haversine distance only (fast)
        facilities = []
        processed_names = set()  # Avoid duplicates
        
        for element in elements:
            try:
                facility = process_facility_element_fast(element, lat, lon)
                if facility and facility['name'] not in processed_names:
                    facilities.append(facility)
                    processed_names.add(facility['name'])
                    
                    # Limit to 40 facilities for citizen dashboard
                    if len(facilities) >= 40:
                        break
            except Exception as e:
                print(f"Error processing facility: {e}")
                continue
        
        # Sort by distance (nearest first)
        facilities.sort(key=lambda x: x['distance_km'])
        
        print(f"Fast Overpass: Processed {len(facilities)} facilities in {radius_km}km")
        
        return {
            "user_location": {"lat": lat, "lon": lon},
            "radius_km": radius_km,
            "facilities": facilities
        }
        
    except requests.exceptions.RequestException as e:
        print(f"Overpass API error: {e}")
        return {
            "user_location": {"lat": lat, "lon": lon},
            "radius_km": radius_km,
            "facilities": []
        }
    except Exception as e:
        print(f"Unexpected error in find_nearby_facilities: {e}")
        return {
            "user_location": {"lat": lat, "lon": lon},
            "radius_km": radius_km,
            "facilities": []
        }

def process_facility_element_fast(element: Dict[str, Any], user_lat: float, user_lon: float) -> Dict[str, Any]:
    """
    Fast processing of facility element - haversine distance only
    
    Args:
        element: Raw facility data from Overpass API
        user_lat, user_lon: User coordinates for distance calculation
    
    Returns:
        Processed facility dict with name, type, coordinates, address, distance
    """
    tags = element.get('tags', {})
    
    # Extract facility name with simple fallbacks
    name = (
        tags.get('name') or 
        tags.get('brand') or 
        f"{tags.get('amenity', 'Medical').title()} Facility"
    )
    
    # Get coordinates based on element type
    if element.get('type') == 'node':
        facility_lat = element.get('lat')
        facility_lon = element.get('lon')
    elif element.get('type') in ['way', 'relation'] and element.get('center'):
        facility_lat = element['center'].get('lat')
        facility_lon = element['center'].get('lon')
    else:
        return None
    
    if not facility_lat or not facility_lon:
        return None
    
    # Simple facility type
    facility_type = tags.get('amenity', 'healthcare')
    
    # Simple address
    address = build_simple_address(tags)
    
    # Fast haversine distance only
    from .osrm_distance import haversine_distance
    distance_km = haversine_distance(user_lat, user_lon, facility_lat, facility_lon)
    
    return {
        "name": name,
        "type": facility_type,
        "latitude": facility_lat,
        "longitude": facility_lon,
        "address": address,
        "distance_km": round(distance_km, 1)
    }

def determine_facility_type(tags: Dict[str, str]) -> str:
    """
    Determine the type of medical facility based on OSM tags
    
    Args:
        tags: OpenStreetMap tags dictionary
    
    Returns:
        Standardized facility type string
    """
    # Check amenity tag first
    amenity = tags.get('amenity', '').lower()
    if amenity in ['hospital', 'clinic', 'pharmacy', 'doctors']:
        return amenity
    
    # Check healthcare tag
    healthcare = tags.get('healthcare', '').lower()
    if healthcare:
        healthcare_mapping = {
            'hospital': 'hospital',
            'clinic': 'clinic', 
            'pharmacy': 'pharmacy',
            'doctor': 'doctors',
            'dentist': 'dentist',
            'physiotherapist': 'physiotherapy'
        }
        return healthcare_mapping.get(healthcare, 'healthcare')
    
    # Check medical speciality
    medical = tags.get('medical', '').lower()
    if medical:
        return f"medical_{medical}"
    
    return 'healthcare'

def build_simple_address(tags: Dict[str, str]) -> str:
    """
    Build a simple address for fast processing
    
    Args:
        tags: OpenStreetMap tags dictionary
    
    Returns:
        Simple address string
    """
    # Quick address building - only essential parts
    parts = []
    
    if tags.get('addr:street'):
        parts.append(tags['addr:street'])
    if tags.get('addr:city'):
        parts.append(tags['addr:city'])
    
    if parts:
        return ', '.join(parts)
    elif tags.get('addr:full'):
        return tags['addr:full']
    else:
        return "Address not available"
