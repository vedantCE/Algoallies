import { motion } from "framer-motion";
import { Sun, Cloud, Droplets, Wind, Thermometer } from "lucide-react";

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  healthTip: string;
}

const mockWeather: WeatherData = {
  temperature: 28,
  condition: "Sunny",
  humidity: 65,
  windSpeed: 12,
  healthTip: "High UV index today. Apply sunscreen and stay hydrated. Avoid outdoor activities between 11 AM - 3 PM.",
};

export const WeatherCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 overflow-hidden relative"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-healthcare-light-blue rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Weather & Health</h3>
            <p className="text-sm text-muted-foreground">Today's forecast</p>
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sun className="text-yellow-500" size={40} />
          </motion.div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <span className="text-5xl font-bold healthcare-gradient-text">
            {mockWeather.temperature}°
          </span>
          <span className="text-xl text-muted-foreground">C</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Cloud className="text-muted-foreground" size={18} />
            <span className="text-sm text-muted-foreground">{mockWeather.condition}</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="text-healthcare-blue" size={18} />
            <span className="text-sm text-muted-foreground">{mockWeather.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="text-muted-foreground" size={18} />
            <span className="text-sm text-muted-foreground">{mockWeather.windSpeed} km/h</span>
          </div>
        </div>

        <div className="p-4 bg-accent/50 rounded-xl">
          <div className="flex items-start gap-3">
            <Thermometer className="text-healthcare-green shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Health Recommendation</p>
              <p className="text-sm text-muted-foreground">{mockWeather.healthTip}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
