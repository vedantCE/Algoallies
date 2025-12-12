import { useState, useEffect } from "react";
import { Hospital, MapPin, Loader2, AlertCircle, Navigation, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Facility {
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address: string;
  distance_km: number;
}

interface UserLocation {
  lat: number;
  lon: number;
}

const HOSPITAL_CACHE_KEY = 'hospital_search_results';
const HOSPITAL_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const HospitalFinderSimple = () => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [radiusKm, setRadiusKm] = useState(2.5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearched, setLastSearched] = useState<Date | null>(null);

  // Load cached results on component mount
  useEffect(() => {
    const cachedData = sessionStorage.getItem(HOSPITAL_CACHE_KEY);
    if (cachedData) {
      try {
        const { userLocation: cachedLocation, facilities: cachedFacilities, radiusKm: cachedRadius, timestamp } = JSON.parse(cachedData);
        const now = new Date().getTime();
        
        // Check if cache is still valid (30 minutes)
        if (now - timestamp < HOSPITAL_CACHE_DURATION) {
          console.log("HospitalFinder: Loading cached search results");
          setUserLocation(cachedLocation);
          setFacilities(cachedFacilities);
          setRadiusKm(cachedRadius);
          setHasSearched(true);
          setLastSearched(new Date(timestamp));
          return;
        } else {
          console.log("HospitalFinder: Cache expired, clearing");
          sessionStorage.removeItem(HOSPITAL_CACHE_KEY);
        }
      } catch (e) {
        console.log("HospitalFinder: Invalid cache, clearing");
        sessionStorage.removeItem(HOSPITAL_CACHE_KEY);
      }
    }
  }, []);

  const getFacilityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "hospital":
        return "text-blue-600";
      case "clinic":
        return "text-green-600";
      case "pharmacy":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const handleSearchHospitals = async () => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Simple geolocation request
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
          }
        );
      });

      const coords = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };

      setUserLocation(coords);
      console.log("Got location:", coords);

      // Try 2.5km first, then 5km if no results
      let response = await fetch(
        `http://127.0.0.1:8000/citizen/nearby-facilities?lat=${coords.lat}&lon=${coords.lon}&radius_km=2.5`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();

      // If no facilities found in 2.5km, try 5km
      if (data.success && (!data.facilities || data.facilities.length === 0)) {
        console.log("No facilities in 2.5km, trying 5km radius...");
        response = await fetch(
          `http://127.0.0.1:8000/citizen/nearby-facilities?lat=${coords.lat}&lon=${coords.lon}&radius_km=5.0`
        );
        
        if (response.ok) {
          const fallbackData = await response.json();
          if (fallbackData.success) {
            data = fallbackData;
            setRadiusKm(5.0); // Update displayed radius
          }
        }
      }

      if (data.success) {
        const searchResults = data.facilities || [];
        const timestamp = new Date().getTime();
        
        // Cache the search results
        sessionStorage.setItem(HOSPITAL_CACHE_KEY, JSON.stringify({
          userLocation: coords,
          facilities: searchResults,
          radiusKm: data.radius_km || radiusKm,
          timestamp
        }));
        
        setFacilities(searchResults);
        setLastSearched(new Date(timestamp));
      } else {
        throw new Error(data.message || "Failed to fetch facilities");
      }

    } catch (err: any) {
      console.error("Hospital search error:", err);
      
      // Use fallback location (Mumbai) and continue with search
      const fallbackCoords = { lat: 19.0760, lon: 72.8777 };
      setUserLocation(fallbackCoords);
      console.log("Using fallback location:", fallbackCoords);
      
      // Still try to search with fallback location
      try {
        let response = await fetch(
          `http://127.0.0.1:8000/citizen/nearby-facilities?lat=${fallbackCoords.lat}&lon=${fallbackCoords.lon}&radius_km=2.5`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data = await response.json();

        if (data.success && (!data.facilities || data.facilities.length === 0)) {
          console.log("No facilities in 2.5km, trying 5km radius...");
          response = await fetch(
            `http://127.0.0.1:8000/citizen/nearby-facilities?lat=${fallbackCoords.lat}&lon=${fallbackCoords.lon}&radius_km=5.0`
          );
          
          if (response.ok) {
            const fallbackData = await response.json();
            if (fallbackData.success) {
              data = fallbackData;
              setRadiusKm(5.0);
            }
          }
        }

        if (data.success) {
          const searchResults = data.facilities || [];
          const timestamp = new Date().getTime();
          
          sessionStorage.setItem(HOSPITAL_CACHE_KEY, JSON.stringify({
            userLocation: fallbackCoords,
            facilities: searchResults,
            radiusKm: data.radius_km || radiusKm,
            timestamp
          }));
          
          setFacilities(searchResults);
          setLastSearched(new Date(timestamp));
          
          // Show warning about using fallback location
          if (err.code === 1) {
            setError("Location permission denied. Showing results for Mumbai instead.");
          } else {
            setError("Could not get your location. Showing results for Mumbai instead.");
          }
        } else {
          throw new Error(data.message || "Failed to fetch facilities");
        }
      } catch (fallbackErr) {
        console.error("Fallback search also failed:", fallbackErr);
        setError("Unable to fetch nearby facilities. Please check your internet connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openInMaps = (lat: number, lon: number, name: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}&query_place_id=${encodeURIComponent(name)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Hospital className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Find Hospitals</h2>
              <p className="text-sm text-slate-600">Locate nearby healthcare facilities</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSearchHospitals}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching nearby hospitals...
              </>
            ) : (
              <>
                <Navigation className="mr-2 h-4 w-4" />
                {hasSearched ? "Search Again" : "Search Nearby Hospitals"}
              </>
            )}
          </Button>
          
          {hasSearched && !isLoading && (
            <Button
              onClick={handleSearchHospitals}
              disabled={isLoading}
              variant="outline"
              size="icon"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={16} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {hasSearched && !isLoading && (
        <div className="glass-card p-6">
          {lastSearched && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-600">
                Last searched: {lastSearched.toLocaleTimeString()}
              </p>
            </div>
          )}
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Nearby Medical Facilities
          </h3>
          
          {facilities.length === 0 ? (
            <div className="text-center py-8">
              <Hospital className="mx-auto text-slate-400 mb-4" size={48} />
              <p className="text-slate-600">No facilities found within {radiusKm} km</p>
              <p className="text-sm text-slate-500 mt-2">Try expanding your search radius</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600 mb-4">
                Found {facilities.length} facilities within {radiusKm} km
              </p>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {facilities.map((facility, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className={`${getFacilityColor(facility.type)} shrink-0`} size={16} />
                          <h4 className="font-semibold text-slate-800 text-sm">{facility.name}</h4>
                        </div>
                        <p className="text-xs text-slate-600 mb-1">
                          Type: {facility.type} | Distance: {facility.distance_km} km
                        </p>
                        <p className="text-xs text-slate-500 mb-2">{facility.address}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openInMaps(facility.latitude, facility.longitude, facility.name)}
                          className="text-xs"
                        >
                          View on Map
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {userLocation && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Your Location:</strong> {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openInMaps(userLocation.lat, userLocation.lon, "Your Location")}
                className="text-xs"
              >
                View Your Location on Map
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
