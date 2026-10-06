import { motion } from "framer-motion";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const TrendIcon = trend?.isPositive ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: "easeOut" }}
      className="glass-card p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon size={22} aria-hidden="true" />
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
              trend.isPositive
                ? "bg-healthcare-light-green text-success"
                : "bg-destructive/10 text-destructive"
            )}
          >
            <TrendIcon size={14} aria-hidden="true" />
            <span className="sr-only">{trend.isPositive ? "Up" : "Down"}</span>
            {trend.value}%
          </span>
        )}
      </div>

      <p className="font-display text-3xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-sm font-medium text-foreground/80">{title}</p>
      {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
    </motion.div>
  );
};
