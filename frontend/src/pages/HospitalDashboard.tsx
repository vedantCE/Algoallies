import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, UserCheck, Package, FileText, Settings, 
  Activity, Thermometer, Wind, Cloud, Droplets,
  CheckCircle, XCircle, Clock, RefreshCw, LogOut
} from "lucide-react";
// Removed DashboardSidebar import - using internal sidebar navigation
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { StatCard } from "@/components/StatCard";
import { SurgePredictionDashboard } from "@/components/SurgePredictionDashboard";

import { AutonomousAgentPanel } from "@/components/AutonomousAgentPanel";
import { Button } from "@/components/ui/button";
import { 
  getStaff, getStaffRecommendations, getInventory, 
  updateInventoryStatus, getDecisionReports, getHospitalSettings,
  getWeather, recalculateInventory, sendCitizenMessage
} from "@/lib/api";

// Hospital stats for overview
const hospitalStats = [
  { title: "Total Patients", value: "1,247", subtitle: "Currently admitted", icon: Users, trend: { value: 12, isPositive: true } },
  { title: "Available Beds", value: "156", subtitle: "Out of 500 total", icon: UserCheck, trend: { value: 8, isPositive: true } },
  { title: "Staff On Duty", value: "89", subtitle: "Doctors & nurses", icon: UserCheck, trend: { value: 5, isPositive: true } },
  { title: "Emergency Cases", value: "23", subtitle: "Today", icon: Activity, trend: { value: 3, isPositive: false } },
];

type SectionType = "overview" | "patients" | "staff" | "inventory" | "reports" | "settings" | "surge" | "cities" | "agent";

export const HospitalDashboard = () => {
  const [selectedSection, setSelectedSection] = useState<SectionType>("overview");
  
  // Weather data state - reusing citizen dashboard logic with geolocation
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  
  // Staff data state
  const [staff, setStaff] = useState<any[]>([]);
  const [staffRecommendations, setStaffRecommendations] = useState<any[]>([]);
  
  // Inventory data state
  const [inventory, setInventory] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  
  // Reports data state
  const [decisions, setDecisions] = useState<any[]>([]);
  
  // Settings data state
  const [settings, setSettings] = useState<any>({});

  // Get user geolocation - same logic as Citizen dashboard
  useEffect(() => {
    console.log("HospitalDashboard mounted");
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          console.log("Hospital dashboard - User coordinates:", coords);
          setUserCoords(coords);
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Always fallback to Mumbai coordinates - this ensures the app works
          const fallback = { lat: 19.0760, lon: 72.8777 };
          console.log("Using fallback coordinates:", fallback);
          setUserCoords(fallback);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      // Fallback if geolocation not supported
      const fallback = { lat: 19.0760, lon: 72.8777 };
      console.log("Geolocation not supported, using fallback:", fallback);
      setUserCoords(fallback);
    }
  }, []);

  // Fetch weather when coordinates are available - same logic as Citizen dashboard
  // Uses /weather/complete endpoint which includes AQI data for consistent display
  useEffect(() => {
    if (!userCoords) return;

    const fetchWeather = async () => {
      try {
        console.log("HospitalDashboard: fetching live weather for", userCoords.lat, userCoords.lon);
        setWeatherLoading(true);
        setWeatherError(false);
        
        // Same API call as Citizen dashboard - includes temperature, humidity, AQI, city name
        const response = await getWeather(userCoords.lat, userCoords.lon);
        console.log("Hospital weather response:", response.data);
        
        if (response.data.success && response.data.weather) {
          setWeather(response.data.weather);
        } else {
          setWeatherError(true);
        }
      } catch (error) {
        console.error("Failed to fetch weather:", error);
        setWeatherError(true);
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, [userCoords]);

  // Fetch data based on selected section
  useEffect(() => {
    if (!userCoords) return; // Wait for coordinates
    
    const fetchSectionData = async () => {
      try {
        switch (selectedSection) {
          case "staff":
            const [staffRes, staffRecRes] = await Promise.all([
              getStaff(userCoords?.lat, userCoords?.lon),
              getStaffRecommendations(userCoords?.lat, userCoords?.lon)
            ]);
            if (staffRes.data.success) setStaff(staffRes.data.staff);
            if (staffRecRes.data.success) setStaffRecommendations(staffRecRes.data.recommendations);
            break;
            
          case "inventory":
            const invRes = await getInventory(userCoords?.lat, userCoords?.lon);
            if (invRes.data.success) setInventory(invRes.data.inventory);
            break;
            
          case "reports":
            const reportsRes = await getDecisionReports();
            if (reportsRes.data.success) setDecisions(reportsRes.data.decisions);
            break;
            
          case "settings":
            const settingsRes = await getHospitalSettings();
            if (settingsRes.data.success) setSettings(settingsRes.data.settings);
            break;
        }
      } catch (error) {
        console.error(`Error fetching ${selectedSection} data:`, error);
      }
    };

    fetchSectionData();
  }, [selectedSection, userCoords]);

  // Handle inventory status updates
  const handleInventoryStatusUpdate = async (itemId: string, status: string) => {
    try {
      await updateInventoryStatus(itemId, status);
      // Refresh inventory data
      const invRes = await getInventory(userCoords?.lat, userCoords?.lon);
      if (invRes.data.success) setInventory(invRes.data.inventory);
    } catch (error) {
      console.error("Error updating inventory status:", error);
    }
  };

  // Handle inventory recalculation
  const handleRecalculateInventory = async () => {
    try {
      setInventoryLoading(true);
      await recalculateInventory(userCoords?.lat, userCoords?.lon);
      const invRes = await getInventory(userCoords?.lat, userCoords?.lon);
      if (invRes.data.success) setInventory(invRes.data.inventory);
    } catch (error) {
      console.error("Error recalculating inventory:", error);
    } finally {
      setInventoryLoading(false);
    }
  };

  // Sidebar navigation items with advanced SurgeSense features
  const sidebarItems = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "patients", label: "Patients", icon: Users },
    { id: "staff", label: "Staff", icon: UserCheck },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "surge", label: "Surge Prediction", icon: Activity },
    { id: "agent", label: "AI Agent", icon: Activity },

    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Weather widget component - reused from citizen dashboard with AQI display
  const WeatherWidget = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 mb-8 overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
      
      <div className="relative z-10">
        {weatherLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading live weather...</p>
          </div>
        ) : weatherError ? (
          <div className="text-center py-8">
            <p className="text-red-600 text-sm">Unable to fetch live weather. Please try again.</p>
          </div>
        ) : weather ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Weather & Health</h3>
                <p className="text-sm text-muted-foreground">📍 {weather.city} - Live Data</p>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Activity className="text-yellow-500" size={40} />
              </motion.div>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                {Math.round(weather.temperature)}°
              </span>
              <span className="text-xl text-muted-foreground">C</span>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Cloud className="text-muted-foreground" size={18} />
                <span className="text-sm text-muted-foreground capitalize">{weather.description}</span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="text-blue-600" size={18} />
                <span className="text-sm text-muted-foreground">{weather.humidity}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="text-muted-foreground" size={18} />
                <span className="text-sm text-muted-foreground">{weather.windSpeed} km/h</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className={`${weather.aqi > 150 ? 'text-red-500' : weather.aqi > 100 ? 'text-yellow-500' : 'text-green-500'}`} size={18} />
                <span className="text-sm text-muted-foreground">AQI {weather.aqi || 'N/A'}</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="flex items-start gap-3">
                <Thermometer className="text-green-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Hospital Operations Alert</p>
                  <p className="text-sm text-muted-foreground">
                    Current conditions in {weather.city}: {Math.round(weather.temperature)}°C, {weather.humidity}% humidity, AQI {weather.aqi} ({weather.aqi_category}). 
                    {weather.aqi > 150 ? 'High AQI - expect respiratory cases.' : weather.temperature > 32 ? 'High temperature - monitor heat-related cases.' : 'Normal conditions - standard operations.'}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </motion.div>
  );

  // Section content components
  const OverviewSection = () => (
    <div className="space-y-8">
      <WeatherWidget />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {hospitalStats.map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={index * 0.1} />
        ))}
      </div>
    </div>
  );

  const PatientsSection = () => (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold mb-4">Patient Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Admitted Patients</h3>
          <p className="text-2xl font-bold text-blue-700">1,247</p>
          <p className="text-sm text-blue-600">+12% from yesterday</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">Discharged Today</h3>
          <p className="text-2xl font-bold text-green-700">89</p>
          <p className="text-sm text-green-600">Normal discharge rate</p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-medium text-yellow-900 mb-2">Pending Admissions</h3>
          <p className="text-2xl font-bold text-yellow-700">23</p>
          <p className="text-sm text-yellow-600">Emergency queue</p>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Recent Admissions</h3>
        <div className="space-y-3">
          {[
            { name: "Patient #2847", condition: "Respiratory distress", time: "2 hours ago", priority: "high" },
            { name: "Patient #2848", condition: "Heat exhaustion", time: "3 hours ago", priority: "medium" },
            { name: "Patient #2849", condition: "Routine checkup", time: "4 hours ago", priority: "low" },
          ].map((patient, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
              <div>
                <p className="font-medium">{patient.name}</p>
                <p className="text-sm text-muted-foreground">{patient.condition}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  patient.priority === "high" ? "bg-red-100 text-red-700" :
                  patient.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {patient.priority}
                </span>
                <p className="text-xs text-muted-foreground mt-1">{patient.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const StaffSection = () => (
    <div className="space-y-6">
      {/* Available Staff */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Available Staff</h3>
        <div className="space-y-3">
          {staff.map((member, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.role} - {member.department}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                member.status === "on_duty" 
                  ? "bg-green-100 text-green-700" 
                  : "bg-gray-100 text-gray-600"
              }`}>
                {member.status === "on_duty" ? "On Duty" : "Off Duty"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Staff Recommendations */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">AI Recommended Staffing</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Based on live weather conditions and surge prediction
        </p>
        <div className="space-y-3">
          {staffRecommendations.map((rec, index) => (
            <div key={index} className={`p-4 rounded-lg border ${
              rec.priority === "high" ? "bg-red-50 border-red-200" :
              rec.priority === "medium" ? "bg-yellow-50 border-yellow-200" :
              "bg-blue-50 border-blue-200"
            }`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{rec.role} - {rec.department}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  rec.priority === "high" ? "bg-red-100 text-red-700" :
                  rec.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
              <p className="text-sm">
                Current: {rec.current_count} → Recommended: {rec.recommended_count}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const InventorySection = () => (
    <div className="glass-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Inventory Management</h3>
        <Button 
          onClick={handleRecalculateInventory}
          disabled={inventoryLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={inventoryLoading ? "animate-spin" : ""} size={16} />
          Recalculate AI Recommendations
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Item Name</th>
              <th className="text-left p-3">Available</th>
              <th className="text-left p-3">AI Recommended</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, index) => (
              <tr key={item._id || index} className="border-b">
                <td className="p-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                </td>
                <td className="p-3">{item.available_quantity} {item.unit}</td>
                <td className="p-3 font-medium">{item.ai_recommended_quantity} {item.unit}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === "approved" ? "bg-green-100 text-green-700" :
                    item.status === "declined" ? "bg-red-100 text-red-700" :
                    item.status === "review" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {item.status || "pending"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleInventoryStatusUpdate(item._id, "approved")}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <CheckCircle size={14} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleInventoryStatusUpdate(item._id, "review")}
                      className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                    >
                      <Clock size={14} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleInventoryStatusUpdate(item._id, "declined")}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <XCircle size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ReportsSection = () => (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">Decision History</h3>
      <div className="space-y-3">
        {decisions.map((decision, index) => (
          <div key={index} className="p-4 bg-accent/30 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">{decision.item_name}</p>
                <p className="text-sm text-muted-foreground">
                  {decision.type === "inventory" ? "Inventory" : "Staff"} Decision
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                decision.final_decision === "approved" ? "bg-green-100 text-green-700" :
                decision.final_decision === "declined" ? "bg-red-100 text-red-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>
                {decision.final_decision}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              Recommendation: {decision.original_recommendation}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(decision.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const SettingsSection = () => (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">Hospital Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Hospital Name</label>
          <p className="text-muted-foreground">{settings.hospital_name || "SurgeSense Medical Center"}</p>
        </div>
        <div>
          <label className="text-sm font-medium">Location</label>
          <p className="text-muted-foreground">{settings.city || "Mumbai"}</p>
        </div>
        <div>
          <label className="text-sm font-medium">AQI Thresholds</label>
          <p className="text-muted-foreground">
            High: {settings.aqi_threshold_high || 150}, Medium: {settings.aqi_threshold_medium || 100}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium">Temperature Thresholds</label>
          <p className="text-muted-foreground">
            High: {settings.temperature_threshold_high || 32}°C, Low: {settings.temperature_threshold_low || 15}°C
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Custom Hospital Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed left-0 top-0 h-full w-64 glass-card rounded-none border-r border-border/30 p-6 flex flex-col z-40"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 healthcare-gradient rounded-xl flex items-center justify-center">
            <Activity className="text-primary-foreground" size={24} />
          </div>
          <span className="font-bold text-xl healthcare-gradient-text">SurgeSense</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {sidebarItems.map((item, index) => {
            const isActive = selectedSection === item.id;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedSection(item.id as SectionType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "healthcare-gradient text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={() => window.location.href = '/login'}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </motion.aside>
      
      <main className="ml-64 flex-1 p-4 sm:p-8 w-full max-w-[calc(100vw-16rem)] overflow-x-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Hospital <span className="healthcare-gradient-text">Dashboard</span>
          </h1>
          <p className="text-muted-foreground">AI-powered hospital operations management</p>
        </motion.div>



        {/* Section indicator - shows current section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Current Section:</span>
            <span className="font-medium text-foreground capitalize">{selectedSection}</span>
          </div>
        </div>

        {/* Dynamic Section Content */}
        <motion.div
          key={selectedSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {selectedSection === "overview" && <OverviewSection />}
          {selectedSection === "patients" && <PatientsSection />}
          {selectedSection === "staff" && <StaffSection />}
          {selectedSection === "inventory" && <InventorySection />}
          {selectedSection === "surge" && <SurgePredictionDashboard userCoords={userCoords} />}
          {selectedSection === "agent" && <AutonomousAgentPanel />}

          {selectedSection === "reports" && <ReportsSection />}
          {selectedSection === "settings" && <SettingsSection />}
        </motion.div>
      </main>

      <FloatingChatbot />
    </div>
  );
};

export default HospitalDashboard;
