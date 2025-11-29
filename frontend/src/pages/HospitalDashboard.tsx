import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendHospitalMessage } from "@/lib/api";
import {
  Users,
  Bed,
  UserCheck,
  AlertTriangle,
  CloudRain,
  Thermometer,
  Wind,
  Calendar,
  Package,
  FileText,
  Download,
  TrendingUp,
  Activity,
} from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const hospitalStats = [
  {
    title: "Total Patients",
    value: "1,247",
    subtitle: "Currently admitted",
    icon: Users,
    trend: { value: 12, isPositive: true },
  },
  {
    title: "Available Beds",
    value: "156",
    subtitle: "Out of 500 total",
    icon: Bed,
    trend: { value: 8, isPositive: true },
  },
  {
    title: "Staff On Duty",
    value: "89",
    subtitle: "Doctors & nurses",
    icon: UserCheck,
    trend: { value: 5, isPositive: true },
  },
  {
    title: "Emergency Cases",
    value: "23",
    subtitle: "Today",
    icon: AlertTriangle,
    trend: { value: 3, isPositive: false },
  },
];

const getIconForType = (iconType: string) => {
  switch (iconType) {
    case "respiratory": return CloudRain;
    case "heat": return Thermometer;
    case "air_quality": return Wind;
    default: return Activity;
  }
};

const staffSchedule = [
  { name: "Dr. Pooja Linagayat", role: "Chief Physician", shift: "Day", status: "on-duty" },
  { name: "Dr. Khushi Bhatt", role: "Surgeon", shift: "Day", status: "on-duty" },
  { name: "Nurse Niru Patel", role: "Head Nurse", shift: "Day", status: "on-duty" },
  { name: "Dr. Hriday Desai", role: "Cardiologist", shift: "Night", status: "off-duty" },
  { name: "Nurse  Lalita", role: "ICU Nurse", shift: "Night", status: "off-duty" },
];

const inventoryItems = [
  { name: "Surgical Masks", stock: 5000, minStock: 1000, status: "good" },
  { name: "Syringes", stock: 2500, minStock: 500, status: "good" },
  { name: "IV Drips", stock: 800, minStock: 200, status: "good" },
  { name: "Antibiotics", stock: 150, minStock: 100, status: "warning" },
  { name: "Blood Units (O+)", stock: 45, minStock: 50, status: "critical" },
];

const medicineInventory = [
  { name: "Paracetamol 500mg", stock: 2000, used: 150, reorder: false },
  { name: "Amoxicillin 250mg", stock: 800, used: 45, reorder: false },
  { name: "Insulin", stock: 120, used: 30, reorder: true },
  { name: "Aspirin 100mg", stock: 1500, used: 80, reorder: false },
  { name: "Metformin 500mg", stock: 600, used: 55, reorder: false },
];

export const HospitalDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [hospitalData, setHospitalData] = useState<any>(null);
  const [weatherRecommendations, setWeatherRecommendations] = useState<any[]>([]);

  useEffect(() => {
    const fetchHospitalData = async () => {
      try {
        console.log("Request sent to backend");
        console.log("Payload:", { query: "Get live weather-based hospital recommendations" });
        
        const response = await sendHospitalMessage("Get live weather-based hospital recommendations");
        console.log("Backend returned:", response.data);
        
        if (response.data.success && response.data.response) {
          try {
            const parsedData = JSON.parse(response.data.response);
            setHospitalData(parsedData);
            setWeatherRecommendations(parsedData.recommendations || []);
          } catch (parseError) {
            console.error("Failed to parse hospital data:", parseError);
            setWeatherRecommendations([
              {
                title: "Weather Data Loading",
                description: "Fetching live weather recommendations...",
                priority: "medium",
                icon_type: "air_quality"
              }
            ]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch hospital data:", error);
        setWeatherRecommendations([
          {
            title: "Connection Error",
            description: "Unable to fetch live weather data. Using default recommendations.",
            priority: "low",
            icon_type: "air_quality"
          }
        ]);
      }
    };

    fetchHospitalData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar type="hospital" />
      
      <main className="ml-64 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Hospital <span className="healthcare-gradient-text">Dashboard</span>
            </h1>
            <p className="text-muted-foreground">
              Real-time insights and management tools
            </p>
          </div>
          <Button className="healthcare-gradient text-primary-foreground">
            <FileText className="mr-2" size={18} />
            Generate Report
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {hospitalStats.map((stat, index) => (
            <StatCard key={stat.title} {...stat} delay={index * 0.1} />
          ))}
        </div>

        {/* AI Weather Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 healthcare-gradient rounded-xl flex items-center justify-center">
              <Activity className="text-primary-foreground" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                AI Weather-Based Recommendations
              </h3>
              <p className="text-sm text-muted-foreground">
                📍 Mumbai - Live weather & AQI insights
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {weatherRecommendations.map((rec, index) => {
              const IconComponent = getIconForType(rec.icon_type);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`p-4 rounded-xl border ${
                    rec.priority === "high"
                      ? "bg-red-50 border-red-200"
                      : rec.priority === "medium"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-healthcare-light-blue border-blue-200"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <IconComponent
                      className={`${
                        rec.priority === "high"
                          ? "text-red-500"
                          : rec.priority === "medium"
                          ? "text-yellow-600"
                          : "text-healthcare-blue"
                      }`}
                      size={24}
                    />
                    <h4 className="font-semibold text-foreground">{rec.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Management Tabs */}
        <Tabs defaultValue="staff" className="mb-8">
          <TabsList className="glass-card p-1 mb-6">
            <TabsTrigger value="staff" className="px-6">
              <Users className="mr-2" size={16} />
              Staff
            </TabsTrigger>
            <TabsTrigger value="equipment" className="px-6">
              <Package className="mr-2" size={16} />
              Equipment
            </TabsTrigger>
            <TabsTrigger value="medicine" className="px-6">
              <Activity className="mr-2" size={16} />
              Medicine
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="staff" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card overflow-hidden"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Staff Schedule</h3>
                  <Button variant="outline" size="sm">
                    <Calendar className="mr-2" size={14} />
                    View Full Schedule
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {staffSchedule.map((staff, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                          <span className="font-medium text-accent-foreground">
                            {staff.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{staff.name}</p>
                          <p className="text-sm text-muted-foreground">{staff.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{staff.shift} Shift</span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            staff.status === "on-duty"
                              ? "bg-healthcare-light-green text-healthcare-green"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {staff.status === "on-duty" ? "On Duty" : "Off Duty"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="equipment" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card overflow-hidden"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Inventory Status</h3>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2" size={14} />
                    Export
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {inventoryItems.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Min. stock: {item.minStock}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{item.stock}</p>
                          <p className="text-xs text-muted-foreground">in stock</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.status === "good"
                              ? "bg-healthcare-light-green text-healthcare-green"
                              : item.status === "warning"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {item.status === "good"
                            ? "Adequate"
                            : item.status === "warning"
                            ? "Low"
                            : "Critical"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="medicine" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card overflow-hidden"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Medicine Inventory</h3>
                  <Button variant="outline" size="sm">
                    <TrendingUp className="mr-2" size={14} />
                    Usage Report
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {medicineInventory.map((med, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-foreground">{med.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Used today: {med.used} units
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{med.stock}</p>
                          <p className="text-xs text-muted-foreground">units</p>
                        </div>
                        {med.reorder && (
                          <Button size="sm" variant="outline" className="text-destructive border-destructive">
                            Reorder
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>

        {/* Live Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Live Activity</h3>
          <div className="space-y-3">
            {[
              { time: "2 min ago", event: "New patient admitted to Ward B", type: "admission" },
              { time: "15 min ago", event: "Surgery completed - Room 4", type: "surgery" },
              { time: "32 min ago", event: "Lab results available for Patient #2847", type: "lab" },
              { time: "1 hr ago", event: "Staff shift change completed", type: "staff" },
            ].map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center gap-4 p-3 bg-accent/30 rounded-lg"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    activity.type === "admission"
                      ? "bg-healthcare-blue"
                      : activity.type === "surgery"
                      ? "bg-healthcare-green"
                      : activity.type === "lab"
                      ? "bg-purple-500"
                      : "bg-yellow-500"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{activity.event}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      <FloatingChatbot />
    </div>
  );
};

export default HospitalDashboard;
