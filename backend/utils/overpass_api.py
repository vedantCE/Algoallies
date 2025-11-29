import requests
import json

def find_medical_places(lat: float, lon: float):
    """
    Find nearby medical facilities using Overpass API based on GPS coordinates
    
    Overpass API is a read-only API that serves up custom selected parts of 
    OpenStreetMap data. It's more powerful than Nominatim for complex queries
    and provides better filtering for specific amenity types.
    
    Args:
        lat: Latitude coordinate (float)
        lon: Longitude coordinate (float)
    
    Returns:
        list: List of medical facilities with name, coordinates, type, and address
    """
    print(f"Overpass API search started for coordinates: {lat}, {lon}")
    
    # Overpass API endpoint - this is the main server that processes our queries
    overpass_url = "https://overpass-api.de/api/interpreter"
    
    # Build Overpass QL (Query Language) query
    # This query searches for medical facilities within 1500 meters of user location
    overpass_query = f"""
    [out:json][timeout:25];
    (
      node["amenity"="clinic"](around:1500,{lat},{lon});
      node["amenity"="hospital"](around:1500,{lat},{lon});
      node["amenity"="pharmacy"](around:1500,{lat},{lon});
      way["amenity"="clinic"](around:1500,{lat},{lon});
      way["amenity"="hospital"](around:1500,{lat},{lon});
      way["amenity"="pharmacy"](around:1500,{lat},{lon});
    );
    out center meta;
    """
    
    # Explanation of Overpass query components:
    # - [out:json] = return results in JSON format
    # - [timeout:25] = maximum 25 seconds for query execution
    # - node["amenity"="clinic"] = search for point locations (nodes) tagged as clinics
    # - way["amenity"="clinic"] = search for area locations (ways/buildings) tagged as clinics
    # - (around:1500,lat,lon) = search within 1500 meter radius of given coordinates
    # - amenity filters: clinic=medical clinics, hospital=hospitals, pharmacy=pharmacies
    # - out center meta = return center coordinates and metadata for ways/areas
    
    print("Overpass query built - searching within 1500m radius")
    print("Searching for: clinics, hospitals, pharmacies")
    
    try:
        # Send POST request to Overpass API with our query
        # Overpass API expects the query as raw text in the request body
        response = requests.post(
            overpass_url,
            data=overpass_query,
            headers={'Content-Type': 'text/plain'},
            timeout=30
        )
        response.raise_for_status()
        
        # Parse JSON response from Overpass API
        data = response.json()
        
        print(f"Overpass API returned {len(data.get('elements', []))} raw results")
        
        # Process and clean the raw Overpass response
        medical_places = []
        
        for element in data.get('elements', []):
            # Extract facility information from Overpass response
            tags = element.get('tags', {})
            
            # Get facility name (try multiple possible tag names)
            name = (tags.get('name') or 
                   tags.get('brand') or 
                   tags.get('operator') or 
                   f"Unnamed {tags.get('amenity', 'facility')}")
            
            # Get coordinates - handle both nodes and ways
            if element.get('type') == 'node':
                # For nodes, coordinates are directly available
                facility_lat = element.get('lat')
                facility_lon = element.get('lon')
            elif element.get('type') == 'way' and element.get('center'):
                # For ways (buildings), use center coordinates
                facility_lat = element['center'].get('lat')
                facility_lon = element['center'].get('lon')
            else:
                # Skip if no valid coordinates
                continue
            
            # Build address from available tags
            address_parts = []
            if tags.get('addr:housenumber'):
                address_parts.append(tags['addr:housenumber'])
            if tags.get('addr:street'):
                address_parts.append(tags['addr:street'])
            if tags.get('addr:city'):
                address_parts.append(tags['addr:city'])
            
            address = ', '.join(address_parts) if address_parts else "Address not available"
            
            # Create clean facility object
            facility = {
                "name": name,
                "lat": facility_lat,
                "lon": facility_lon,
                "type": tags.get('amenity', 'unknown'),
                "address": address
            }
            
            medical_places.append(facility)
        
        print(f"Processed {len(medical_places)} medical facilities successfully")
        return medical_places
        
    except requests.exceptions.RequestException as e:
        print(f"Overpass API request error: {str(e)}")
        return []
    except json.JSONDecodeError as e:
        print(f"Overpass API response parsing error: {str(e)}")
        return []
    except Exception as e:
        print(f"Overpass API unexpected error: {str(e)}")
        return []