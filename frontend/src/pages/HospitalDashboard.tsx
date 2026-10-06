import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, UserCheck, Package, FileText, Settings, LayoutDashboard,
  Activity, Wind, Cloud, Droplets, TrendingUp, Bot, BedDouble, Siren,
  CheckCircle, XCircle, Clock, RefreshCw, MapPin, AlertTriangle, Gauge,
} from "lucide-react";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { DashboardShell, DashboardNavItem } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSectionParam } from "@/hooks/use-section-param";
import { cn } from "@/lib/utils";
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
  { title: "Available Beds", value: "156", subtitle: "Out of 500 total", icon: BedDouble, trend: { value: 8, isPositive: true } },
  { title: "Staff On Duty", value: "89", subtitle: "Doctors & nurses", icon: UserCheck, trend: { value: 5, isPositive: true } },
  { title: "Emergency Cases", value: "23", subtitle: "Today", icon: Siren, trend: { value: 3, isPositive: false } },
];

const SECTIONS = ["overview", "patients", "staff", "inventory", "surge", "agent", "reports", "settings"] as const;
type SectionType = (typeof SECTIONS)[number];

const navItems: DashboardNavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "patients", label: "Patients", icon: Users },
  { id: "staff", label: "Staff", icon: UserCheck },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "surge", label: "Surge Prediction", icon: TrendingUp },
  { id: "agent", label: "AI Agent", icon: Bot },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

const sectionCopy: Record<SectionType, { title: string; description: string }> = {
  overview: { title: "Hospital overview", description: "Live operations, weather risk and capacity at a glance." },
  patients: { title: "Patients", description: "Admissions, discharges and the emergency queue." },
  staff: { title: "Staff", description: "Who's on duty and AI staffing recommendations." },
  inventory: { title: "Inventory", description: "Review AI-recommended stock levels." },
  surge: { title: "Surge prediction", description: "AI-powered patient surge forecasting." },
  agent: { title: "AI agent", description: "Autonomous monitoring and recommended actions." },
  reports: { title: "Reports", description: "History of approved and declined recommendations." },
  settings: { title: "Settings", description: "Hospital profile and alert thresholds." },
};

const statusBadge: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-800",
  declined: "bg-red-100 text-red-800",
  review: "bg-amber-100 text-amber-900",
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-900",
  low: "bg-emerald-100 text-emerald-800",
};

const Badge = ({ value }: { value?: string }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
      statusBadge[value ?? ""] ?? "bg-muted text-muted-foreground"
    )}
  >
    {value || "pending"}
  </span>
);

const ListSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="space-y-3" aria-label="Loading">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
    ))}
  </div>
);

export const HospitalDashboard = () => {
  const [selectedSection, setSelectedSection] = useSectionParam(SECTIONS, "overview");
  const [sectionLoading, setSectionLoading] = useState(false);
  
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
      setSectionLoading(true);
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
      } finally {
        setSectionLoading(false);
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

  // Weather widget with AQI display
  const WeatherWidget = () => {
    const aqiTone =
      weather?.aqi > 150 ? "text-red-700 bg-red-100" : weather?.aqi > 100 ? "text-amber-900 bg-amber-100" : "text-emerald-800 bg-emerald-100";
    const alert =
      weather?.aqi > 150
        ? { tone: "border-red-200 bg-red-50 text-red-900", text: "High AQI — expect an increase in respiratory cases." }
        : weather?.temperature > 32
          ? { tone: "border-orange-200 bg-orange-50 text-orange-900", text: "High temperature — monitor for heat-related cases." }
          : { tone: "border-primary/15 bg-accent text-accent-foreground", text: "Normal conditions — standard operations." };

    return (
      <section className="glass-card p-6" aria-labelledby="ops-weather-heading" aria-live="polite" aria-busy={weatherLoading}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id="ops-weather-heading" className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Cloud className="text-primary" size={22} aria-hidden="true" />
            Weather &amp; operations risk
          </h2>
          {weather && !weatherLoading && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <MapPin size={12} aria-hidden="true" />
              {weather.city} · Live
            </span>
          )}
        </div>

        {weatherLoading ? (
          <div className="space-y-4">
            <div className="h-12 w-28 animate-pulse rounded-lg bg-muted" />
            <div className="h-16 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : weatherError ? (
          <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-foreground">
            Unable to fetch live weather. Refresh the page to try again.
          </p>
        ) : weather ? (
          <>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-display text-5xl font-bold tabular-nums text-foreground">
                  {Math.round(weather.temperature)}°<span className="text-2xl text-muted-foreground">C</span>
                </p>
                <p className="mt-1 capitalize text-muted-foreground">{weather.description}</p>
              </div>
              <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
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
                <div className="flex items-center gap-2">
                  <Gauge size={18} className="text-primary" aria-hidden="true" />
                  <dt className="sr-only">Air quality index</dt>
                  <dd className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", aqiTone)}>
                    AQI {weather.aqi ?? "N/A"}{weather.aqi_category ? ` · ${weather.aqi_category}` : ""}
                  </dd>
                </div>
              </dl>
            </div>
            <div className={cn("flex items-start gap-3 rounded-xl border p-4", alert.tone)}>
              <AlertTriangle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">Operations alert</p>
                <p className="text-sm">{alert.text}</p>
              </div>
            </div>
          </>
        ) : null}
      </section>
    );
  };

  // Section content components
  const OverviewSection = () => (
    <div className="space-y-6">
      <section aria-label="Key hospital metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {hospitalStats.map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={index * 0.05} />
        ))}
      </section>
      <WeatherWidget />
    </div>
  );

  const PatientsSection = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Admitted patients", value: "1,247", note: "+12% from yesterday", icon: Users },
          { label: "Discharged today", value: "89", note: "Normal discharge rate", icon: CheckCircle },
          { label: "Pending admissions", value: "23", note: "Emergency queue", icon: Clock },
        ].map((item) => (
          <div key={item.label} className="glass-card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <item.icon size={20} aria-hidden="true" />
            </div>
            <p className="font-display text-2xl font-bold tabular-nums text-foreground">{item.value}</p>
            <p className="text-sm font-medium text-foreground/80">{item.label}</p>
            <p className="text-sm text-muted-foreground">{item.note}</p>
          </div>
        ))}
      </div>
      <section className="glass-card p-6" aria-labelledby="recent-admissions">
        <h2 id="recent-admissions" className="mb-4 text-lg font-semibold text-foreground">Recent admissions</h2>
        <ul className="divide-y divide-border">
          {[
            { name: "Patient #2847", condition: "Respiratory distress", time: "2 hours ago", priority: "high" },
            { name: "Patient #2848", condition: "Heat exhaustion", time: "3 hours ago", priority: "medium" },
            { name: "Patient #2849", condition: "Routine checkup", time: "4 hours ago", priority: "low" },
          ].map((patient) => (
            <li key={patient.name} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{patient.name}</p>
                <p className="text-sm text-muted-foreground">{patient.condition}</p>
              </div>
              <div className="shrink-0 text-right">
                <Badge value={patient.priority} />
                <p className="mt-1 text-xs text-muted-foreground">{patient.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );

  const StaffSection = () => (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="glass-card p-6" aria-labelledby="staff-available">
        <h2 id="staff-available" className="mb-4 text-lg font-semibold text-foreground">Available staff</h2>
        {sectionLoading && staff.length === 0 ? (
          <ListSkeleton />
        ) : staff.length === 0 ? (
          <EmptyState icon={UserCheck} title="No staff data" description="Staff records will appear here once available." className="py-8" />
        ) : (
          <ul className="divide-y divide-border">
            {staff.map((member, index) => (
              <li key={index} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role} · {member.department}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    member.status === "on_duty" ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", member.status === "on_duty" ? "bg-emerald-600" : "bg-muted-foreground")} aria-hidden="true" />
                  {member.status === "on_duty" ? "On duty" : "Off duty"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass-card p-6" aria-labelledby="staff-ai">
        <h2 id="staff-ai" className="text-lg font-semibold text-foreground">AI recommended staffing</h2>
        <p className="mb-4 text-sm text-muted-foreground">Based on live weather conditions and surge prediction</p>
        {sectionLoading && staffRecommendations.length === 0 ? (
          <ListSkeleton />
        ) : staffRecommendations.length === 0 ? (
          <EmptyState icon={Bot} title="No recommendations right now" description="Staffing looks adequate for current conditions." className="py-8" />
        ) : (
          <ul className="space-y-3">
            {staffRecommendations.map((rec, index) => (
              <li key={index} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="font-medium text-foreground">{rec.role} · {rec.department}</h3>
                  <Badge value={rec.priority} />
                </div>
                <p className="mb-2 text-sm text-muted-foreground">{rec.reason}</p>
                <p className="text-sm tabular-nums text-foreground">
                  Current <span className="font-semibold">{rec.current_count}</span>
                  <span className="mx-2 text-muted-foreground" aria-hidden="true">→</span>
                  <span className="sr-only">, </span>
                  Recommended <span className="font-semibold text-primary">{rec.recommended_count}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );

  const inventoryActions = [
    { status: "approved", label: "Approve", icon: CheckCircle, className: "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800" },
    { status: "review", label: "Mark for review", icon: Clock, className: "text-amber-700 hover:bg-amber-50 hover:text-amber-800" },
    { status: "declined", label: "Decline", icon: XCircle, className: "text-red-700 hover:bg-red-50 hover:text-red-800" },
  ];

  const InventorySection = () => (
    <section className="glass-card p-6" aria-labelledby="inventory-heading">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="inventory-heading" className="text-lg font-semibold text-foreground">Stock recommendations</h2>
        <Button onClick={handleRecalculateInventory} disabled={inventoryLoading} variant="outline">
          <RefreshCw className={inventoryLoading ? "animate-spin" : ""} aria-hidden="true" />
          {inventoryLoading ? "Recalculating…" : "Recalculate with AI"}
        </Button>
      </div>

      {sectionLoading && inventory.length === 0 ? (
        <ListSkeleton rows={4} />
      ) : inventory.length === 0 ? (
        <EmptyState icon={Package} title="No inventory items" description="Inventory items and AI recommendations will appear here." />
      ) : (
        <div className="-mx-6 overflow-x-auto px-6">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="py-3 pr-4">Item</th>
                <th scope="col" className="py-3 pr-4 text-right">Available</th>
                <th scope="col" className="py-3 pr-4 text-right">AI recommended</th>
                <th scope="col" className="py-3 pr-4">Status</th>
                <th scope="col" className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inventory.map((item, index) => (
                <tr key={item._id || index} className="transition-colors hover:bg-muted/40">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">{item.available_quantity} {item.unit}</td>
                  <td className="py-3 pr-4 text-right font-semibold tabular-nums">{item.ai_recommended_quantity} {item.unit}</td>
                  <td className="py-3 pr-4"><Badge value={item.status} /></td>
                  <td className="py-3">
                    <div className="flex justify-end gap-1">
                      {inventoryActions.map((action) => (
                        <Tooltip key={action.status}>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={`${action.label} ${item.name}`}
                              aria-pressed={item.status === action.status}
                              onClick={() => handleInventoryStatusUpdate(item._id, action.status)}
                              className={cn("h-10 w-10", action.className, item.status === action.status && "bg-muted")}
                            >
                              <action.icon aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{action.label}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const ReportsSection = () => (
    <section className="glass-card p-6" aria-labelledby="reports-heading">
      <h2 id="reports-heading" className="mb-4 text-lg font-semibold text-foreground">Decision history</h2>
      {sectionLoading && decisions.length === 0 ? (
        <ListSkeleton />
      ) : decisions.length === 0 ? (
        <EmptyState icon={FileText} title="No decisions yet" description="Approve or decline inventory recommendations to build a history." action={
          <Button variant="outline" onClick={() => setSelectedSection("inventory")}>
            <Package aria-hidden="true" />
            Go to inventory
          </Button>
        } />
      ) : (
        <ul className="divide-y divide-border">
          {decisions.map((decision, index) => (
            <li key={index} className="py-4">
              <div className="mb-1 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{decision.item_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {decision.type === "inventory" ? "Inventory" : "Staff"} decision
                  </p>
                </div>
                <Badge value={decision.final_decision} />
              </div>
              <p className="text-sm text-muted-foreground">Recommendation: {decision.original_recommendation}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                <time dateTime={decision.timestamp}>{new Date(decision.timestamp).toLocaleString()}</time>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  const SettingsSection = () => (
    <section className="glass-card max-w-3xl p-6" aria-labelledby="settings-heading">
      <h2 id="settings-heading" className="mb-4 text-lg font-semibold text-foreground">Hospital settings</h2>
      <dl className="divide-y divide-border">
        {[
          ["Hospital name", settings.hospital_name || "SurgeSense Medical Center"],
          ["Location", settings.city || "Mumbai"],
          ["AQI thresholds", `High ${settings.aqi_threshold_high || 150} · Medium ${settings.aqi_threshold_medium || 100}`],
          ["Temperature thresholds", `High ${settings.temperature_threshold_high || 32}°C · Low ${settings.temperature_threshold_low || 15}°C`],
        ].map(([label, value]) => (
          <div key={label} className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-foreground">{label}</dt>
            <dd className="text-sm text-muted-foreground sm:col-span-2">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );

  const copy = sectionCopy[selectedSection];

  return (
    <DashboardShell
      brand="SurgeSense"
      roleLabel="Hospital"
      items={navItems}
      active={selectedSection}
      onSelect={(id) => setSelectedSection(id as SectionType)}
      title={copy.title}
      description={copy.description}
    >
      <motion.div
        key={selectedSection}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
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

      <FloatingChatbot />
    </DashboardShell>
  );
};

export default HospitalDashboard;
