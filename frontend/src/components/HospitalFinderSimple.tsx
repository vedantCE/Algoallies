import { useState, useEffect } from "react";
import { Hospital, MapPin, Loader2, AlertCircle, Navigation, ExternalLink, Pill, Stethoscope, LocateFixed } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
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

  const getFacilityStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case "hospital":
        return { icon: Hospital, tint: "bg-blue-100 text-blue-800" };
      case "clinic":
        return { icon: Stethoscope, tint: "bg-emerald-100 text-emerald-800" };
      case "pharmacy":
        return { icon: Pill, tint: "bg-orange-100 text-orange-800" };
      default:
        return { icon: MapPin, tint: "bg-muted text-muted-foreground" };
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
        `${import.meta.env.VITE_BACKEND_URL}/citizen/nearby-facilities?lat=${coords.lat}&lon=${coords.lon}&radius_km=2.5`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();

      // If no facilities found in 2.5km, try 5km
      if (data.success && (!data.facilities || data.facilities.length === 0)) {
        console.log("No facilities in 2.5km, trying 5km radius...");
        response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/citizen/nearby-facilities?lat=${coords.lat}&lon=${coords.lon}&radius_km=5.0`
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
          `${import.meta.env.VITE_BACKEND_URL}/citizen/nearby-facilities?lat=${fallbackCoords.lat}&lon=${fallbackCoords.lon}&radius_km=2.5`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data = await response.json();

        if (data.success && (!data.facilities || data.facilities.length === 0)) {
          console.log("No facilities in 2.5km, trying 5km radius...");
          response = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/citizen/nearby-facilities?lat=${fallbackCoords.lat}&lon=${fallbackCoords.lon}&radius_km=5.0`
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
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <LocateFixed size={22} aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Search near your location</h2>
            <p className="text-sm text-muted-foreground">
              We'll ask for location access. Results within {radiusKm} km.
            </p>
          </div>
        </div>
        <Button onClick={handleSearchHospitals} disabled={isLoading} className="h-11 sm:min-w-[200px]">
          {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Navigation aria-hidden="true" />}
          {isLoading ? "Searching…" : hasSearched ? "Search again" : "Search nearby"}
        </Button>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 shrink-0 text-amber-700" size={18} aria-hidden="true" />
          <p className="text-sm text-amber-900">{error}</p>
        </div>
      )}

      <div aria-live="polite" aria-busy={isLoading}>
        {isLoading && (
          <ul className="space-y-3" aria-label="Loading facilities">
            {[0, 1, 2].map((i) => (
              <li key={i} className="glass-card h-24 animate-pulse bg-muted/60" />
            ))}
          </ul>
        )}

        {!hasSearched && !isLoading && (
          <div className="glass-card">
            <EmptyState
              icon={Hospital}
              title="Find care near you"
              description="Search to see hospitals, clinics and pharmacies around your current location, sorted by distance."
            />
          </div>
        )}

        {hasSearched && !isLoading && (
          <section aria-labelledby="facilities-heading">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3 id="facilities-heading" className="font-semibold text-foreground">
                {facilities.length > 0
                  ? `${facilities.length} facilities within ${radiusKm} km`
                  : "Nearby medical facilities"}
              </h3>
              {lastSearched && (
                <p className="text-xs text-muted-foreground">
                  Updated {lastSearched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>

            {facilities.length === 0 ? (
              <div className="glass-card">
                <EmptyState
                  icon={MapPin}
                  title={`No facilities found within ${radiusKm} km`}
                  description="Try searching again from a different location, or call 108 in an emergency."
                />
              </div>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {facilities.map((facility, index) => {
                  const style = getFacilityStyle(facility.type);
                  const TypeIcon = style.icon;
                  return (
                    <li key={index} className="glass-card flex gap-4 p-4 transition-colors duration-200 hover:border-primary/40">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.tint}`}>
                        <TypeIcon size={20} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold leading-snug text-foreground">{facility.name}</h4>
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground">
                            {facility.distance_km} km
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs font-medium capitalize text-muted-foreground">{facility.type}</p>
                        {facility.address && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{facility.address}</p>
                        )}
                        <Button
                          size="sm"
                          variant="link"
                          onClick={() => openInMaps(facility.latitude, facility.longitude, facility.name)}
                          className="mt-1 h-9 px-0"
                        >
                          Directions
                          <ExternalLink aria-hidden="true" />
                          <span className="sr-only">(opens Google Maps in a new tab)</span>
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {userLocation && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openInMaps(userLocation.lat, userLocation.lon, "Your Location")}
                className="mt-4 text-muted-foreground"
              >
                <MapPin aria-hidden="true" />
                View your location on map
              </Button>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
