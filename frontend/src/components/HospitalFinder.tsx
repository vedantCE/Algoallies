import { useState } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { Hospital, MapPin, Loader2, AlertCircle, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons for different facility types
const createCustomIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = createCustomIcon("red");
const hospitalIcon = createCustomIcon("blue");
const clinicIcon = createCustomIcon("green");
const pharmacyIcon = createCustomIcon("orange");
const defaultIcon = createCustomIcon("grey");

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

interface HospitalFinderProps {
  onClose?: () => void;
}

export const HospitalFinder = ({ onClose }: HospitalFinderProps) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [radiusKm] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const getFacilityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "hospital":
        return hospitalIcon;
      case "clinic":
        return clinicIcon;
      case "pharmacy":
        return pharmacyIcon;
      default:
        return defaultIcon;
    }
  };

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
      // Get user's current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported by this browser"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const coords = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };

      setUserLocation(coords);

      // Call backend API with real coordinates
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/citizen/nearby-facilities?lat=${coords.lat}&lon=${coords.lon}&radius_km=${radiusKm}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setFacilities(data.facilities || []);
      } else {
        throw new Error(data.message || "Failed to fetch facilities");
      }

    } catch (err: any) {
      console.error("Hospital search error:", err);
      
      if (err.code === err.PERMISSION_DENIED) {
        setError("Location access denied. Please enable location permission and try again.");
      } else if (err.code === err.TIMEOUT) {
        setError("Location request timed out. Please try again.");
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setError("Location information unavailable. Please try again.");
      } else {
        setError(err.message || "Failed to search for nearby hospitals. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
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
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <AlertCircle size={20} />
            </Button>
          )}
        </div>

        <Button
          onClick={handleSearchHospitals}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching nearby hospitals...
            </>
          ) : (
            <>
              <Navigation className="mr-2 h-4 w-4" />
              Search Nearby Hospitals
            </>
          )}
        </Button>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={16} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Results Section */}
      {hasSearched && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Facilities List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6"
          >
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
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
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
                          <p className="text-xs text-slate-500">{facility.address}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>

          {/* Map */}
          {userLocation && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Map View</h3>
              <div style={{ height: "400px", width: "100%" }}>
                <MapContainer
                  center={[userLocation.lat, userLocation.lon]}
                  zoom={13}
                  scrollWheelZoom={true}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon}>
                    <Popup>Your Location</Popup>
                  </Marker>
                  <Circle
                    center={[userLocation.lat, userLocation.lon]}
                    radius={radiusKm * 1000}
                    pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.1, weight: 2 }}
                  />
                  {facilities.map((facility, index) => (
                    <Marker
                      key={`facility-${index}`}
                      position={[facility.latitude, facility.longitude]}
                      icon={getFacilityIcon(facility.type)}
                    >
                      <Popup>{`${facility.name} - ${facility.type} - ${facility.distance_km}km`}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-medium text-slate-700 mb-2">Legend:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-slate-600">Your Location</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-slate-600">Hospital</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-slate-600">Clinic</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-slate-600">Pharmacy</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};