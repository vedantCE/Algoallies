import { motion } from "framer-motion";
import { Heart, Activity, Moon, Footprints, Hospital, Phone, Lightbulb, Calendar, Plus } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { WeatherCard } from "@/components/WeatherCard";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";

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

const quickActions = [
  {
    icon: Hospital,
    title: "Find Hospitals",
    description: "Locate nearby healthcare facilities",
    color: "bg-healthcare-light-blue",
    iconColor: "text-healthcare-blue",
  },
  {
    icon: Phone,
    title: "Emergency",
    description: "Quick access to emergency services",
    color: "bg-red-100",
    iconColor: "text-red-500",
  },
  {
    icon: Lightbulb,
    title: "Health Tips",
    description: "Daily wellness recommendations",
    color: "bg-healthcare-light-green",
    iconColor: "text-healthcare-green",
  },
  {
    icon: Calendar,
    title: "Appointments",
    description: "Schedule your next visit",
    color: "bg-purple-100",
    iconColor: "text-purple-500",
  },
];

const upcomingAppointments = [
  {
    doctor: "Dr. Sarah Johnson",
    specialty: "General Physician",
    date: "Dec 15, 2024",
    time: "10:00 AM",
  },
  {
    doctor: "Dr. Michael Chen",
    specialty: "Cardiologist",
    date: "Dec 20, 2024",
    time: "2:30 PM",
  },
];

export const CitizenDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar type="citizen" />
      
      <main className="ml-64 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Good morning, <span className="healthcare-gradient-text">John</span>! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's your health overview for today
          </p>
        </motion.div>

        {/* Health Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {healthMetrics.map((metric, index) => (
            <StatCard
              key={metric.title}
              {...metric}
              delay={index * 0.1}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Weather Card */}
          <div className="lg:col-span-2">
            <WeatherCard />
          </div>

          {/* Upcoming Appointments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Upcoming Appointments
              </h3>
              <Button variant="ghost" size="icon" className="text-primary">
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
                  className="p-4 bg-accent/50 rounded-xl"
                >
                  <p className="font-medium text-foreground">{apt.doctor}</p>
                  <p className="text-sm text-muted-foreground">{apt.specialty}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-healthcare-blue">{apt.date}</span>
                    <span className="text-muted-foreground">{apt.time}</span>
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
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="glass-card p-6 text-left group"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <action.icon className={action.iconColor} size={24} />
                </div>
                <h4 className="font-semibold text-foreground mb-1">
                  {action.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Health Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 healthcare-gradient opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <svg className="w-40 h-40" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={283}
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset: 283 * 0.15 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(217 91% 60%)" />
                    <stop offset="100%" stopColor="hsl(160 84% 39%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, type: "spring" }}
                    className="text-4xl font-bold healthcare-gradient-text"
                  >
                    85
                  </motion.span>
                  <p className="text-sm text-muted-foreground">Health Score</p>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Your Health Score is Excellent!
              </h3>
              <p className="text-muted-foreground mb-4">
                You're doing great! Keep maintaining your healthy lifestyle with regular
                exercise, balanced diet, and adequate sleep.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Exercise", "Nutrition", "Sleep", "Hydration"].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <FloatingChatbot />
    </div>
  );
};

export default CitizenDashboard;
