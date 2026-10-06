import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { box: "w-8 h-8 rounded-lg", icon: 18, text: "text-lg" },
  md: { box: "w-10 h-10 rounded-xl", icon: 22, text: "text-xl" },
  lg: { box: "w-12 h-12 rounded-xl", icon: 26, text: "text-2xl" },
};

export const BrandLogo = ({ name = "HealthAI", size = "md", className }: BrandLogoProps) => {
  const s = sizes[size];
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className={cn("healthcare-gradient flex items-center justify-center shadow-sm", s.box)}>
        <Activity className="text-primary-foreground" size={s.icon} aria-hidden="true" />
      </span>
      <span className={cn("font-display font-bold healthcare-gradient-text", s.text)}>{name}</span>
    </span>
  );
};
