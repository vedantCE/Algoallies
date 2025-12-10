import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  MapPin, Thermometer, Wind, Droplets, Activity,
  TrendingUp, TrendingDown, AlertTriangle, RefreshCw,
  Shield, Eye, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CityData {
  city: string;
  conditions: {
    temperature: number;
    humidity: number;
    aqi: number;
    aqi_category: string;
    description: string;
  };
  advisory: {
    risk_assessment: {
      overall_risk_score: number;
      risk_level: string;
      risk_color: string;
      component_risks: {
        temperature: number;
        aqi: number;
        humidity: number;
        seasonal: number;
      };
    };
    recommendations: string[];
    precautions: string[];
    outdoor_timing: {
      best_times: string[];
      avoid_times: string[];
    };
  };
}

interface MultiCityData {
  timestamp: string;
  cities_analyzed: number;
  summary: {
    highest_risk_city: {
      name: string;
      risk_score: number;
      risk_level: string;
    };
    lowest_risk_city: {
      name: string;
      risk_score: number;
      risk_level: string;
    };
    average_risk_score: number;
  };
  city_data: CityData[];
}

const availableCities = [
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata",
  "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Surat"
];

export const MultiCityComparison = () => {
  const [multiCityData, setMultiCityData] = useState<MultiCityData | null>(null);
  const [selectedCities, setSelectedCities] = useState<string[]>(["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMultiCityData = async (cities?: string[]) => {
    try {
      setLoading(true);
      setError("");
      
      let url = "http://127.0.0.1:8000/api/cities/comparison";
      let options: RequestInit = { method: "GET" };
      
      if (cities && cities.length > 0) {
        url = "http://127.0.0.1:8000/api/cities/comparison";
        options = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cities })
        };
      }
      
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (data.success) {
        setMultiCityData(data.comparison);
      } else {
        setError(data.message || "Failed to fetch city data");
      }
    } catch (err) {
      setError("Unable to connect to multi-city service");
      console.error("Multi-city comparison error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMultiCityData(selectedCities);
  }, []);

  const handleCityChange = (cities: string[]) => {
    setSelectedCities(cities);
    fetchMultiCityData(cities);
  };

  const handleRefresh = () => {
    fetchMultiCityData(selectedCities);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case "very high": return "bg-red-500 text-white";
      case "high": return "bg-red-400 text-white";
      case "moderate": return "bg-yellow-400 text-black";
      case "low": return "bg-green-400 text-white";
      case "very low": return "bg-blue-400 text-white";
      default: return "bg-gray-400 text-white";
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case "very high":
      case "high":
        return <TrendingUp size={16} />;
      case "moderate":
        return <Activity size={16} />;
      case "low":
      case "very low":
        return <TrendingDown size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin mr-2" size={20} />
        <span>Loading city comparison...</span>
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

  if (!multiCityData) return null;

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Multi-City Health Comparison</h2>
          <p className="text-muted-foreground">Compare health risks across Indian cities</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedCities.join(",")}
            onValueChange={(value) => handleCityChange(value.split(","))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mumbai,Delhi,Bangalore,Chennai,Kolkata">Top 5 Cities</SelectItem>
              <SelectItem value="Mumbai,Delhi,Pune,Ahmedabad">Western India</SelectItem>
              <SelectItem value="Chennai,Bangalore,Hyderabad">Southern India</SelectItem>
              <SelectItem value="Delhi,Jaipur,Kolkata">Northern India</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Highest Risk</p>
                <p className="text-lg font-bold">{multiCityData.summary.highest_risk_city.name}</p>
                <p className="text-sm text-muted-foreground">
                  {multiCityData.summary.highest_risk_city.risk_score}/100 - {multiCityData.summary.highest_risk_city.risk_level}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                <Shield size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lowest Risk</p>
                <p className="text-lg font-bold">{multiCityData.summary.lowest_risk_city.name}</p>
                <p className="text-sm text-muted-foreground">
                  {multiCityData.summary.lowest_risk_city.risk_score}/100 - {multiCityData.summary.lowest_risk_city.risk_level}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Risk</p>
                <p className="text-lg font-bold">{multiCityData.summary.average_risk_score}/100</p>
                <p className="text-sm text-muted-foreground">
                  Across {multiCityData.cities_analyzed} cities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* City Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {multiCityData.city_data.map((cityData, index) => (
          <motion.div
            key={cityData.city}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin size={20} />
                    {cityData.city}
                  </CardTitle>
                  <Badge className={getRiskColor(cityData.advisory.risk_assessment.risk_level)}>
                    <div className="flex items-center gap-1">
                      {getRiskIcon(cityData.advisory.risk_assessment.risk_level)}
                      {cityData.advisory.risk_assessment.risk_level}
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Environmental Conditions */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Thermometer className="text-red-500" size={16} />
                    <span>{cityData.conditions.temperature}°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="text-blue-500" size={16} />
                    <span>{cityData.conditions.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="text-gray-500" size={16} />
                    <span>AQI {cityData.conditions.aqi}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="text-green-500" size={16} />
                    <span className="capitalize">{cityData.conditions.description}</span>
                  </div>
                </div>

                {/* Risk Score Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Risk Score</span>
                    <span className="font-bold">{cityData.advisory.risk_assessment.overall_risk_score}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        cityData.advisory.risk_assessment.overall_risk_score >= 80 ? 'bg-red-500' :
                        cityData.advisory.risk_assessment.overall_risk_score >= 60 ? 'bg-yellow-500' :
                        cityData.advisory.risk_assessment.overall_risk_score >= 40 ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${cityData.advisory.risk_assessment.overall_risk_score}%` }}
                    />
                  </div>
                </div>

                {/* Best Times for Outdoor Activities */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock size={16} />
                    Best Times Outdoors
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cityData.advisory.outdoor_timing.best_times.map((time, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Top Recommendations */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Top Recommendations</div>
                  <div className="space-y-1">
                    {cityData.advisory.recommendations.slice(0, 2).map((rec, i) => (
                      <div key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                        <span className="text-blue-600 shrink-0">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Precautions */}
                {cityData.advisory.precautions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-red-700">Health Precautions</div>
                    <div className="space-y-1">
                      {cityData.advisory.precautions.slice(0, 1).map((precaution, i) => (
                        <div key={i} className="text-xs text-red-600 flex items-start gap-1">
                          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                          <span>{precaution}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Last Updated */}
      <div className="text-center text-xs text-muted-foreground">
        Last updated: {new Date(multiCityData.timestamp).toLocaleString()}
      </div>
    </div>
  );
};