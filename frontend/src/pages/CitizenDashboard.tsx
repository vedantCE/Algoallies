import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Heart, Activity, Moon, Footprints, Hospital, Phone, Lightbulb, 
  Calendar, Plus, MapPin, X, Settings, Bell, MessageSquare, Home,
  LogOut, Cloud, Droplets, Wind, Sun, Thermometer, User
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
      {/* Functional Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed left-0 top-0 h-full w-64 glass-card rounded-none border-r border-border/30 p-6 flex flex-col z-40"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
            <Activity className="text-white" size={24} />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            HealthAI
          </span>
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

      {/* Main Content */}
      <main className="ml-64 flex-1 p-4 sm:p-8 w-full max-w-[calc(100vw-16rem)] overflow-x-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Good morning, <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">User</span>! 👋
          </h1>
          <p className="text-slate-600">
            Here's your health overview for today
          </p>
        </motion.div>

        {/* Dynamic Content Based on Active Section */}
        {activeSection === "health" && (
          <>
            {/* Health Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {healthMetrics.map((metric, index) => (
                <StatCard
                  key={metric.title}
                  {...metric}
                  delay={index * 0.1}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
              {/* Dynamic Weather Card */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
                  
                  <div className="relative z-10">
                    {weatherLoading ? (
                      <div className="text-center py-8">
                        <p className="text-slate-600">Loading live weather...</p>
                      </div>
                    ) : weatherError ? (
                      <div className="text-center py-8">
                        <p className="text-red-600 text-sm">Unable to fetch live weather. Please try again.</p>
                      </div>
                    ) : weather ? (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800">Weather & Health</h3>
                            <p className="text-sm text-slate-600">📍 {weather.city} - Live Data</p>
                          </div>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          >
                            <Sun className="text-yellow-500" size={40} />
                          </motion.div>
                        </div>

                        <div className="flex items-center gap-2 mb-6">
                          <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                            {Math.round(weather.temperature)}°
                          </span>
                          <span className="text-xl text-slate-600">C</span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="flex items-center gap-2">
                            <Cloud className="text-slate-600" size={18} />
                            <span className="text-sm text-slate-600 capitalize">{weather.description}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Droplets className="text-blue-600" size={18} />
                            <span className="text-sm text-slate-600">{weather.humidity}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Wind className="text-slate-600" size={18} />
                            <span className="text-sm text-slate-600">{weather.windSpeed} km/h</span>
                          </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-xl">
                          <div className="flex items-start gap-3">
                            <Thermometer className="text-green-600 shrink-0 mt-0.5" size={20} />
                            <div>
                              <p className="text-sm font-medium text-slate-800 mb-1">Health Recommendation</p>
                              <p className="text-sm text-slate-600">{getHealthRecommendation(weather.temperature)}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </motion.div>
              </div>

              {/* Upcoming Appointments */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Upcoming Appointments
                  </h3>
                  <Button variant="ghost" size="icon" className="text-blue-600">
                    <Plus size={20} />
                  </Button>
                </div>
                <div className="space-y-4">
                  {upcomingAppointments.map((apt, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="p-4 bg-slate-50 rounded-xl"
                    >
                      <p className="font-medium text-slate-800">{apt.doctor}</p>
                      <p className="text-sm text-slate-600">{apt.specialty}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-blue-600">{apt.date}</span>
                        <span className="text-slate-600">{apt.time}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <h3 className="text-xl font-semibold text-slate-800 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSectionChange("hospitals")}
                  className="glass-card p-6 text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Hospital className="text-blue-600" size={24} />
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-1">Find Hospitals</h4>
                  <p className="text-sm text-slate-600">Locate nearby healthcare facilities</p>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleEmergency}
                  className="glass-card p-6 text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Phone className="text-red-500" size={24} />
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-1">Emergency</h4>
                  <p className="text-sm text-slate-600">Call 108 - Emergency services</p>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSectionChange("ai")}
                  className="glass-card p-6 text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Lightbulb className="text-green-600" size={24} />
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-1">Health Tips</h4>
                  <p className="text-sm text-slate-600">AI-powered recommendations</p>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSectionChange("appointments")}
                  className="glass-card p-6 text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Calendar className="text-purple-500" size={24} />
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-1">Appointments</h4>
                  <p className="text-sm text-slate-600">Schedule your next visit</p>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}

        {activeSection === "appointments" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Appointments</h2>
            <p className="text-slate-600 mb-6">No appointments yet</p>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              Book Appointment (coming soon)
            </Button>
          </motion.div>
        )}

        {activeSection === "hospitals" && (
          <HospitalFinderSimple />
        )}

        {activeSection === "ai" && (
          <AIConsultation userCoords={userCoords} />
        )}

        {activeSection === "profile" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Health Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
                <input 
                  type="number" 
                  placeholder="Enter your age"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    const profile = JSON.parse(localStorage.getItem('healthProfile') || '{}');
                    profile.age = e.target.value;
                    localStorage.setItem('healthProfile', JSON.stringify(profile));
                  }}
                  defaultValue={JSON.parse(localStorage.getItem('healthProfile') || '{}').age || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    const profile = JSON.parse(localStorage.getItem('healthProfile') || '{}');
                    profile.gender = e.target.value;
                    localStorage.setItem('healthProfile', JSON.stringify(profile));
                  }}
                  defaultValue={JSON.parse(localStorage.getItem('healthProfile') || '{}').gender || ''}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Weight (kg)</label>
                <input 
                  type="number" 
                  placeholder="Enter your weight"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    const profile = JSON.parse(localStorage.getItem('healthProfile') || '{}');
                    profile.weight = e.target.value;
                    localStorage.setItem('healthProfile', JSON.stringify(profile));
                  }}
                  defaultValue={JSON.parse(localStorage.getItem('healthProfile') || '{}').weight || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Activity Level</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    const profile = JSON.parse(localStorage.getItem('healthProfile') || '{}');
                    profile.activityLevel = e.target.value;
                    localStorage.setItem('healthProfile', JSON.stringify(profile));
                  }}
                  defaultValue={JSON.parse(localStorage.getItem('healthProfile') || '{}').activityLevel || 'moderate'}
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light Activity</option>
                  <option value="moderate">Moderate Activity</option>
                  <option value="active">Very Active</option>
                </select>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Health Conditions</label>
              <textarea 
                placeholder="Any chronic conditions, allergies, or medications (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  const profile = JSON.parse(localStorage.getItem('healthProfile') || '{}');
                  profile.healthConditions = e.target.value;
                  localStorage.setItem('healthProfile', JSON.stringify(profile));
                }}
                defaultValue={JSON.parse(localStorage.getItem('healthProfile') || '{}').healthConditions || ''}
              />
            </div>
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">✓ Profile saved automatically. Go to AI Consultation to generate your personalized health plan.</p>
            </div>
          </motion.div>
        )}

        {activeSection === "notifications" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-slate-600">No new notifications</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Settings</h2>
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-xl">
                <h3 className="font-semibold text-slate-800 mb-2">Account Information</h3>
                <p className="text-sm text-slate-600 mb-1">Email: citizen@test.com</p>
                <p className="text-sm text-slate-600">Role: Citizen</p>
              </div>
              <Button 
                onClick={() => navigate("/login")}
                variant="destructive"
              >
                Logout
              </Button>
            </div>
          </motion.div>
        )}
      </main>

      <FloatingChatbot />
    </div>
  );
};

export default CitizenDashboard;
