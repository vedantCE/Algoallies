import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Heart, Activity, Moon, Footprints, Phone, Calendar, MapPin, Settings, Bell,
  MessageSquare, Home, Cloud, Droplets, Wind, User, ThermometerSun, Snowflake,
  SunMedium, RefreshCw, Stethoscope, ChevronRight,
} from "lucide-react";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { StatCard } from "@/components/StatCard";
import { AIConsultation } from "@/components/AIConsultation";
import { HospitalFinderSimple } from "@/components/HospitalFinderSimple";
import { HealthProfileForm } from "@/components/HealthProfileForm";
import { DashboardShell, DashboardNavItem } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { getHealthAdvisory, getWeather } from "@/lib/api";
import { loadHealthProfile } from "@/lib/health-profile";
import { useSectionParam } from "@/hooks/use-section-param";

const SECTIONS = ["health", "appointments", "hospitals", "ai", "profile", "notifications", "settings"] as const;
type SectionType = (typeof SECTIONS)[number];

interface WeatherData {
  temperature: number;
  humidity: number;
  description: string;
  windSpeed: number;
  city: string;
}

const healthMetrics = [
  { title: "Heart Rate", value: "72", subtitle: "bpm · Normal", icon: Heart, trend: { value: 2, isPositive: true } },
  { title: "Steps Today", value: "8,432", subtitle: "Goal: 10,000", icon: Footprints, trend: { value: 15, isPositive: true } },
  { title: "Sleep", value: "7.5", subtitle: "hours last night", icon: Moon, trend: { value: 5, isPositive: true } },
  { title: "Activity", value: "45", subtitle: "active minutes", icon: Activity, trend: { value: 8, isPositive: false } },
];

const upcomingAppointments = [
  { doctor: "Dr. Khushi Bhatt", specialty: "General Physician", date: "Dec 15, 2024", time: "10:00 AM" },
  { doctor: "Dr. Pooja Lingayat", specialty: "Cardiologist", date: "Dec 20, 2024", time: "2:30 PM" },
];

const navItems: DashboardNavItem[] = [
  { id: "health", label: "Overview", icon: Home },
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "hospitals", label: "Find Hospitals", icon: MapPin },
  { id: "ai", label: "AI Consultation", icon: MessageSquare },
  { id: "profile", label: "Health Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
];

const sectionCopy: Record<SectionType, { title: string; description: string }> = {
  health: { title: "", description: "Here's your health overview for today." },
  appointments: { title: "Appointments", description: "Manage your upcoming medical appointments." },
  hospitals: { title: "Find Hospitals", description: "Locate hospitals, clinics and pharmacies near you." },
  ai: { title: "AI Consultation", description: "Weather-aware, personalised health guidance." },
  profile: { title: "Health Profile", description: "Tell us a little about yourself for better recommendations." },
  notifications: { title: "Notifications", description: "Alerts and reminders about your health." },
  settings: { title: "Settings", description: "Customise your dashboard preferences." },
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const getHealthRecommendation = (temp: number) => {
  if (temp > 32) {
    return {
      icon: ThermometerSun,
      tone: "bg-orange-50 text-orange-900 border-orange-200",
      text: "High temperature. Stay hydrated, avoid going out in peak afternoon heat, and wear light clothing.",
    };
  }
  if (temp < 15) {
    return {
      icon: Snowflake,
      tone: "bg-sky-50 text-sky-900 border-sky-200",
      text: "Cold weather. Keep warm, avoid sudden exposure to cold air, and drink warm fluids.",
    };
  }
  return {
    icon: SunMedium,
    tone: "bg-accent text-accent-foreground border-primary/15",
    text: "Weather is moderate. Maintain regular hydration, light activity, and balanced nutrition.",
  };
};

export const CitizenDashboard = () => {
  const [activeSection, setActiveSection] = useSectionParam(SECTIONS, "health");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [, setHealthAdvisory] = useState<any>(null);
  const [firstName, setFirstName] = useState(() => loadHealthProfile().name?.split(" ")[0] || "");

  // Get user geolocation
  useEffect(() => {
    const fallback = { lat: 19.076, lon: 72.8777 }; // Mumbai
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserCoords({ lat: position.coords.latitude, lon: position.coords.longitude }),
        (error) => {
          console.error("Geolocation error:", error);
          setUserCoords(fallback);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setUserCoords(fallback);
    }
  }, []);

  const fetchWeather = useCallback(async () => {
    if (!userCoords) return;
    try {
      setWeatherLoading(true);
      setWeatherError(false);
      const response = await getWeather(userCoords.lat, userCoords.lon);
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
  }, [userCoords]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  // Fetch health advisory
  useEffect(() => {
    getHealthAdvisory()
      .then((response) => setHealthAdvisory(response.data.advisory))
      .catch((error) => console.error("Failed to fetch health advisory:", error));
  }, []);

  const emergencyButton = (
    <Button asChild variant="destructive" className="h-11 gap-2 rounded-xl px-4 font-semibold shadow-sm">
      <a href="tel:108" aria-label="Call emergency services, 108">
        <Phone aria-hidden="true" />
        <span>Emergency 108</span>
      </a>
    </Button>
  );

  const copy = sectionCopy[activeSection];
  const title =
    activeSection === "health" ? (
      <>
        {getGreeting()}
        {firstName && (
          <>
            , <span className="healthcare-gradient-text">{firstName}</span>
          </>
        )}
      </>
    ) : (
      copy.title
    );

  return (
    <DashboardShell
      brand="HealthAI"
      roleLabel="Citizen"
      items={navItems}
      active={activeSection}
      onSelect={(id) => setActiveSection(id as SectionType)}
      title={title}
      description={copy.description}
      headerActions={emergencyButton}
    >
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {activeSection === "health" && (
          <div className="space-y-6">
            {/* Health Metrics */}
            <section aria-label="Today's health metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {healthMetrics.map((metric, index) => (
                <StatCard key={metric.title} {...metric} delay={index * 0.05} />
              ))}
            </section>

            <div className="grid gap-6 xl:grid-cols-5">
              {/* Weather & Health */}
              <section className="glass-card p-6 xl:col-span-3" aria-labelledby="weather-heading">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 id="weather-heading" className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Cloud className="text-primary" size={22} aria-hidden="true" />
                    Weather &amp; health advisory
                  </h2>
                  {weather && !weatherLoading && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      <MapPin size={12} aria-hidden="true" />
                      {weather.city}
                    </span>
                  )}
                </div>

                <div aria-live="polite" aria-busy={weatherLoading}>
                  {weatherLoading ? (
                    <div className="space-y-4" aria-label="Loading weather">
                      <div className="flex items-end gap-4">
                        <div className="h-12 w-24 animate-pulse rounded-lg bg-muted" />
                        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                      </div>
                      <div className="h-16 animate-pulse rounded-xl bg-muted" />
                    </div>
                  ) : weatherError ? (
                    <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-foreground">We couldn't load live weather right now.</p>
                      <Button variant="outline" size="sm" onClick={fetchWeather}>
                        <RefreshCw aria-hidden="true" />
                        Try again
                      </Button>
                    </div>
                  ) : weather ? (
                    <>
                      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                        <div>
                          <p className="font-display text-5xl font-bold tabular-nums text-foreground">
                            {Math.round(weather.temperature)}°<span className="text-2xl text-muted-foreground">C</span>
                          </p>
                          <p className="mt-1 capitalize text-muted-foreground">{weather.description}</p>
                        </div>
                        <dl className="flex gap-6 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Droplets size={18} className="text-primary" aria-hidden="true" />
                            <dt className="sr-only">Humidity</dt>
                            <dd><span className="font-semibold text-foreground">{weather.humidity}%</span> humidity</dd>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Wind size={18} className="text-primary" aria-hidden="true" />
                            <dt className="sr-only">Wind speed</dt>
                            <dd><span className="font-semibold text-foreground">{weather.windSpeed}</span> km/h</dd>
                          </div>
                        </dl>
                      </div>
                      {(() => {
                        const rec = getHealthRecommendation(weather.temperature);
                        const RecIcon = rec.icon;
                        return (
                          <div className={`flex items-start gap-3 rounded-xl border p-4 ${rec.tone}`}>
                            <RecIcon size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                            <p className="text-sm leading-relaxed">{rec.text}</p>
                          </div>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={() => setActiveSection("ai")}
                        className="mt-4 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        Get a full personalised plan
                        <ChevronRight size={16} aria-hidden="true" />
                      </button>
                    </>
                  ) : null}
                </div>
              </section>

              {/* Upcoming Appointments */}
              <section className="glass-card p-6 xl:col-span-2" aria-labelledby="appointments-heading">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 id="appointments-heading" className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Calendar className="text-secondary" size={22} aria-hidden="true" />
                    Upcoming appointments
                  </h2>
                  <Button size="sm" variant="outline" onClick={() => setActiveSection("hospitals")}>
                    <Stethoscope aria-hidden="true" />
                    Find care
                  </Button>
                </div>

                <ul className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <li
                      key={appointment.doctor}
                      className="flex items-center gap-4 rounded-xl border border-border bg-muted/40 p-4"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent font-display text-sm font-semibold text-accent-foreground">
                        {appointment.doctor.replace("Dr. ", "").split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{appointment.doctor}</p>
                        <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium tabular-nums text-foreground">{appointment.date}</p>
                        <p className="text-sm tabular-nums text-muted-foreground">{appointment.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}

        {activeSection === "appointments" && (
          <div className="glass-card">
            <EmptyState
              icon={Calendar}
              title="Appointment booking is coming soon"
              description="For now, find a nearby hospital or clinic and contact them directly to book."
              action={
                <Button onClick={() => setActiveSection("hospitals")}>
                  <MapPin aria-hidden="true" />
                  Find nearby hospitals
                </Button>
              }
            />
          </div>
        )}

        {activeSection === "hospitals" && <HospitalFinderSimple />}

        {activeSection === "ai" && (
          <AIConsultation userCoords={userCoords} onOpenProfile={() => setActiveSection("profile")} />
        )}

        {activeSection === "profile" && (
          <div className="max-w-3xl">
            <HealthProfileForm
              onSaved={() => setFirstName(loadHealthProfile().name?.split(" ")[0] || "")}
            />
          </div>
        )}

        {activeSection === "notifications" && (
          <div className="glass-card">
            <EmptyState
              icon={Bell}
              title="You're all caught up"
              description="Weather alerts and appointment reminders will appear here."
            />
          </div>
        )}

        {activeSection === "settings" && (
          <div className="glass-card">
            <EmptyState
              icon={Settings}
              title="Settings are coming soon"
              description="You can already personalise recommendations from your health profile."
              action={
                <Button variant="outline" onClick={() => setActiveSection("profile")}>
                  <User aria-hidden="true" />
                  Edit health profile
                </Button>
              }
            />
          </div>
        )}
      </motion.div>

      <FloatingChatbot />
    </DashboardShell>
  );
};

export default CitizenDashboard;
