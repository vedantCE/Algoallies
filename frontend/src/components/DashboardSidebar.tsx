import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  Activity,
  Calendar,
  MessageSquare,
  MapPin,
  Bell,                                                                                                      
  Settings,
  Users,
  FileText,
  Pill,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  type: "citizen" | "hospital";
}

const citizenLinks = [
  { icon: Home, label: "Dashboard", path: "/citizen" },
  { icon: Activity, label: "Health Metrics", path: "/citizen/metrics" },
  { icon: Calendar, label: "Appointments", path: "/citizen/appointments" },
  { icon: MapPin, label: "Find Hospitals", path: "/citizen/hospitals" },
  { icon: MessageSquare, label: "AI Consultation", path: "/citizen/consultation" },
  { icon: Bell, label: "Notifications", path: "/citizen/notifications" },
  { icon: Settings, label: "Settings", path: "/citizen/settings" },
];

const hospitalLinks = [
  { icon: Home, label: "Dashboard", path: "/hospital" },
  { icon: Users, label: "Patients", path: "/hospital/patients" },
  { icon: Users, label: "Staff", path: "/hospital/staff" },
  { icon: Pill, label: "Inventory", path: "/hospital/inventory" },
  { icon: Calendar, label: "Scheduling", path: "/hospital/scheduling" },
  { icon: FileText, label: "Reports", path: "/hospital/reports" },
  { icon: Settings, label: "Settings", path: "/hospital/settings" },
];

export const DashboardSidebar = ({ type }: SidebarProps) => {
  const location = useLocation();
  const links = type === "citizen" ? citizenLinks : hospitalLinks;

  return (
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
        <span className="font-bold text-xl healthcare-gradient-text">HealthAI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {links.map((link, index) => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;

          return (
            <motion.div
              key={link.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NavLink
                to={link.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "healthcare-gradient text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{link.label}</span>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Logout */}
      <NavLink
        to="/login"
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
      >
        <LogOut size={20} />
        <span className="font-medium">Logout</span>
      </NavLink>
    </motion.aside>
  );
};
