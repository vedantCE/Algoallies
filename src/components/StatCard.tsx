import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
}

export const StatCard = ({ title, value, subtitle, icon: Icon, trend, delay = 0 }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="glass-card p-6 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl healthcare-gradient flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
          <Icon className="text-primary-foreground" size={24} />
        </div>
        {trend && (
          <span
            className={`text-sm font-medium px-2 py-1 rounded-full ${
              trend.isPositive
                ? "bg-healthcare-light-green text-healthcare-green"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>

      <motion.h3
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.1, type: "spring" }}
        className="text-3xl font-bold text-foreground mb-1"
      >
        {value}
      </motion.h3>
      
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>
      )}
    </motion.div>
  );
};
