import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, Activity, Moon, Footprints, Hospital, Phone, Lightbulb, 
  Calendar, Plus, MapPin, X, Settings, Bell, MessageSquare, Home,
  LogOut, Cloud, Droplets, Wind, Sun, Thermometer, User, Menu
} from "lucide-react";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { StatCard } from "@/components/StatCard";
import { AIConsultation } from "@/components/AIConsultation";
import { HospitalFinderSimple } from "@/components/HospitalFinderSimple";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getHealthAdvisory, getWeather } from "@/lib/api";
import { useNavigate } from "react-router-dom";

type SectionType = "health" | "appointments" | "hospitals" | "ai" | "profile" | "notifications" | "settings";

interface WeatherData {
  temperature: number;
  humidity: number;
  description: string;
  windSpeed: number;
  city: string;
}

const healthMetrics = [
  {
    title: "Heart Rate",
    value: "72",
    subtitle: "bpm • Normal",
    icon: Heart,
    trend: { value: 2, isPositive: true },
  },
  {
    title: "Steps Today",
    value: "8,432",
    subtitle: "Goal: 10,000",
    icon: Footprints,
    trend: { value: 15, isPositive: true },
  },
  {
    title: "Sleep",
    value: "7.5",
    subtitle: "hours last night",
    icon: Moon,
    trend: { value: 5, isPositive: true },
  },
  {
    title: "Activity",
    value: "45",
    subtitle: "active minutes",
    icon: Activity,
    trend: { value: 8, isPositive: false },
  },
];

const upcomingAppointments = [
  {
    doctor: "Dr. Khushi Bhatt",
    specialty: "General Physician",
    date: "Dec 15, 2024",
    time: "10:00 AM",
  },
  {
    doctor: "Dr. Pooja Lingayat",
    specialty: "Cardiologist",
    date: "Dec 20, 2024",
    time: "2:30 PM",
  },
];

export const CitizenDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionType>("health");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [healthAdvisory, setHealthAdvisory] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get user geolocation
  useEffect(() => {
    console.log("CitizenDashboard mounted");
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          console.log("User coordinates:", coords);
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

  // Fetch weather when coordinates are available
  useEffect(() => {
    if (!userCoords) return;

    const fetchWeather = async () => {
      try {
        console.log("CitizenDashboard: fetching live weather for", userCoords.lat, userCoords.lon);
        setWeatherLoading(true);
        setWeatherError(false);
        
        const response = await getWeather(userCoords.lat, userCoords.lon);
        console.log("Weather response:", response.data);
        
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

  // Fetch health advisory
  useEffect(() => {
    const fetchHealthAdvisory = async () => {
      try {
        const response = await getHealthAdvisory();
        setHealthAdvisory(response.data.advisory);
      } catch (error) {
        console.error("Failed to fetch health advisory:", error);
      }
    };

    fetchHealthAdvisory();
  }, []);

  const handleSectionChange = (section: SectionType) => {
    console.log("Sidebar: switched to section", section);
    setActiveSection(section);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleEmergency = () => {
    window.open("tel:108", "_self");
  };

  const getHealthRecommendation = (temp: number): string => {
    if (temp > 32) {
      return "🌡️ High temperature detected. Stay hydrated, avoid going out in peak afternoon heat, and wear light clothing.";
    } else if (temp < 15) {
      return "❄️ Cold weather alert. Keep warm, avoid sudden exposure to cold air, and drink warm fluids.";
    } else {
      return "☀️ Weather is moderate. Maintain regular hydration, light activity, and balanced nutrition.";
    }
  };

  // Sidebar navigation
  const sidebarLinks = [
    { icon: Home, label: "Health Metrics", section: "health" as SectionType },
    { icon: Calendar, label: "Appointments", section: "appointments" as SectionType },
    { icon: MapPin, label: "Find Hospitals", section: "hospitals" as SectionType },
    { icon: MessageSquare, label: "AI Consultation", section: "ai" as SectionType },
    { icon: User, label: "Health Profile", section: "profile" as SectionType },
    { icon: Bell, label: "Notifications", section: "notifications" as SectionType },
    { icon: Settings, label: "Settings", section: "settings" as SectionType },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Collapsible Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed left-0 top-0 h-full w-[260px] glass-card rounded-none border-r border-border/30 p-6 flex flex-col z-50 bg-white shadow-xl"
          >
            {/* Close Button */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <Activity className="text-white" size={24} />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  HealthAI
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
              {sidebarLinks.map((link, index) => {
                const isActive = activeSection === link.section;
                const Icon = link.icon;

                return (
                  <motion.button
                    key={link.section}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSectionChange(link.section)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg border-l-4 border-blue-400"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{link.label}</span>
                  </motion.button>
                );
              })}
            </nav>

            {/* Logout */}
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 p-4 sm:p-8 w-full overflow-x-hidden transition-all duration-300 ${sidebarOpen ? 'ml-[260px]' : 'ml-0'}`}>
        {/* Header with Hamburger */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu size={24} className="text-slate-600" />
            </button>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Good morning, <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">User</span>! 👋
          </h1>
          <p className="text-slate-600">
            Here's your health overview for today
          </p>
        </motion.div>

        {/* Dynamic Content Based on Active Section */}
        {activeSection === "health" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Health Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {healthMetrics.map((metric, index) => (
                <motion.div
                  key={metric.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StatCard {...metric} />
                </motion.div>
              ))}
            </div>

            {/* Weather & Health Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6 rounded-2xl"
            >
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Cloud className="text-blue-600" size={24} />
                Weather & Health Advisory
              </h2>
              
              {weatherLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ) : weatherError ? (
                <p className="text-slate-600">Unable to load weather data</p>
              ) : weather ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{weather.temperature}°C</p>
                      <p className="text-slate-600 capitalize">{weather.description}</p>
                      <p className="text-sm text-slate-500">{weather.city}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Droplets size={16} />
                        {weather.humidity}% humidity
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Wind size={16} />
                        {weather.windSpeed} km/h
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-800">
                      {getHealthRecommendation(weather.temperature)}
                    </p>
                  </div>
                </div>
              ) : null}
            </motion.div>

            {/* Upcoming Appointments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar className="text-green-600" size={24} />
                  Upcoming Appointments
                </h2>
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-green-600">
                  <Plus size={16} className="mr-1" />
                  Book
                </Button>
              </div>
              
              <div className="space-y-3">
                {upcomingAppointments.map((appointment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-800">{appointment.doctor}</p>
                      <p className="text-sm text-slate-600">{appointment.specialty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-800">{appointment.date}</p>
                      <p className="text-sm text-slate-600">{appointment.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeSection === "appointments" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-2xl"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Appointments</h2>
            <p className="text-slate-600">Manage your medical appointments here.</p>
          </motion.div>
        )}

        {activeSection === "hospitals" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HospitalFinderSimple />
          </motion.div>
        )}

        {activeSection === "ai" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AIConsultation userCoords={userCoords} />
          </motion.div>
        )}

        {activeSection === "profile" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-2xl"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Health Profile</h2>
            <p className="text-slate-600">View and manage your health profile information.</p>
          </motion.div>
        )}

        {activeSection === "notifications" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-2xl"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Notifications</h2>
            <p className="text-slate-600">Stay updated with your health notifications.</p>
          </motion.div>
        )}

        {activeSection === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-2xl"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Settings</h2>
            <p className="text-slate-600">Customize your dashboard preferences.</p>
          </motion.div>
        )}

        {/* Emergency Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="fixed bottom-6 right-6"
        >
          <Button
            onClick={handleEmergency}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 shadow-lg"
          >
            <Phone size={24} />
          </Button>
        </motion.div>
      </main>

      <FloatingChatbot />
    </div>
  );
};

export default CitizenDashboard;