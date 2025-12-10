import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, AlertTriangle, Users, Clock, 
  Activity, Thermometer, Wind, Droplets,
  RefreshCw, Calendar, MapPin, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SurgeReport {
  timestamp: string;
  conditions: {
    temperature: number;
    humidity: number;
    aqi: number;
    aqi_category: string;
    description: string;
  };
  overall_surge_multiplier: number;
  risk_level: string;
  risk_color: string;
  peak_hours: string[];
  department_predictions: Record<string, {
    base_patients: number;
    predicted_patients: number;
    surge_percentage: number;
    primary_factors: string[];
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: string;
    icon_type: string;
  }>;
  total_predicted_patients: number;
  summary: string;
}

interface SurgePredictionDashboardProps {
  onRefresh?: () => void;
}

export const SurgePredictionDashboard = ({ onRefresh }: SurgePredictionDashboardProps) => {
  const [surgeData, setSurgeData] = useState<SurgeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSurgeData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch("http://127.0.0.1:8000/api/surge/prediction");
      const data = await response.json();
      
      if (data.success) {
        setSurgeData(data.surge_report);
      } else {
        setError(data.message || "Failed to fetch surge data");
      }
    } catch (err) {
      setError("Unable to connect to surge prediction service");
      console.error("Surge prediction error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurgeData();
    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchSurgeData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchSurgeData();
    onRefresh?.();
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "moderate": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin mr-2" size={20} />
        <span>Loading surge prediction...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
          <Button onClick={handleRefresh} className="mt-4" variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!surgeData) return null;

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Surge Prediction Dashboard</h2>
          <p className="text-muted-foreground">AI-powered patient surge forecasting</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getRiskColor(surgeData.risk_level)}`}>
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Risk Level</p>
                <p className="text-xl font-bold">{surgeData.risk_level}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Predicted Patients</p>
                <p className="text-xl font-bold">{surgeData.total_predicted_patients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Target size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Surge Multiplier</p>
                <p className="text-xl font-bold">{surgeData.overall_surge_multiplier}x</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Peak Hours</p>
                <p className="text-sm font-medium">{surgeData.peak_hours.join(", ")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity size={20} />
            Current Environmental Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Thermometer className="text-red-500" size={18} />
              <span className="text-sm">Temperature: {surgeData.conditions.temperature}°C</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="text-blue-500" size={18} />
              <span className="text-sm">Humidity: {surgeData.conditions.humidity}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="text-gray-500" size={18} />
              <span className="text-sm">AQI: {surgeData.conditions.aqi} ({surgeData.conditions.aqi_category})</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="text-green-500" size={18} />
              <span className="text-sm capitalize">{surgeData.conditions.description}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Predictions */}
      <Card>
        <CardHeader>
          <CardTitle>Department-wise Surge Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(surgeData.department_predictions).map(([deptName, data]) => (
              <motion.div
                key={deptName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{deptName}</h4>
                  <Badge variant={data.surge_percentage > 30 ? "destructive" : data.surge_percentage > 10 ? "default" : "secondary"}>
                    +{data.surge_percentage}%
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Base: {data.base_patients} patients</span>
                  <span>→</span>
                  <span className="font-medium text-foreground">Predicted: {data.predicted_patients} patients</span>
                </div>
                {data.primary_factors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">Factors:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.primary_factors.map((factor, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle size={20} />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {surgeData.recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 border rounded-lg"
              >
                <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(rec.priority)}`} />
                <div className="flex-1">
                  <h5 className="font-medium">{rec.title}</h5>
                  <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {rec.priority} priority
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Calendar className="text-blue-600 shrink-0 mt-1" size={20} />
            <div>
              <h4 className="font-semibold mb-2">Summary</h4>
              <p className="text-muted-foreground">{surgeData.summary}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Last updated: {new Date(surgeData.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};