import requests

def find_nearby_clinics(lat: float, lon: float):
    """
    Find nearby clinics using GPS coordinates (latitude & longitude)
    Uses OpenStreetMap Nominatim API to search for healthcare facilities
    
    Args:
        lat: Latitude coordinate (float)
        lon: Longitude coordinate (float)
    
    Returns:
        list: List of nearby clinics with name, coordinates, and address
    """
    print("Clinic search started...")
    
    # Create search bounding box around user location (approximately 5km radius)
    # Viewbox format: left,top,right,bottom (longitude,latitude,longitude,latitude)
    bbox_size = 0.05  # Roughly 5km in degrees
    viewbox = f"{lon-bbox_size},{lat+bbox_size},{lon+bbox_size},{lat-bbox_size}"
    
    # Nominatim API URL for searching healthcare facilities
    # amenity=clinic searches for medical clinics specifically
    url = "https://nominatim.openstreetmap.org/search"
    
    params = {
        "q": "clinic hospital healthcare",  # Search terms for medical facilities
        "format": "json",                   # Response format
        "viewbox": viewbox,                 # Geographic bounding box for search
        "bounded": "1",                     # Restrict results to viewbox area
        "limit": "10",                      # Maximum 10 results
        "amenity": "clinic,hospital"        # Specific amenity types
    }
    
    # Custom User-Agent header required by Nominatim API
    # Helps identify our application and prevents rate limiting
    headers = {
        "User-Agent": "SurgeSense/1.0 (healthcare-app)"
    }
    
    try:
        # Make HTTP request to Nominatim API
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Extract clinic information from API response
        clinics = []
        for item in data:
            clinic = {
                "name": item.get("display_name", "Unknown Clinic"),
                "lat": float(item.get("lat", 0)),
                "lon": float(item.get("lon", 0)),
                "address": item.get("display_name", "Address not available")
            }
            clinics.append(clinic)
        
        print(f"Clinics found: {len(clinics)}")
        return clinics
        
    except requests.exceptions.RequestException as e:
        print(f"Clinic API error: {str(e)}")
        return []
    except (ValueError, KeyError) as e:
        print(f"Clinic API error: Invalid response format - {str(e)}")
        return []