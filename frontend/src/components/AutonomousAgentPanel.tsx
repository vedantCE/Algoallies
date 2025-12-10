import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Bot, Play, Pause, RefreshCw, AlertTriangle, 
  CheckCircle, Clock, Users, Package, Settings,
  TrendingUp, Activity, Zap, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface AutonomousAnalysis {
  timestamp: string;
  surge_report: {
    risk_level: string;
    overall_surge_multiplier: number;
    total_predicted_patients: number;
    summary: string;
  };
  ai_recommendations: {
    priority_alerts: Array<{
      title: string;
      message: string;
      priority: string;
      department: string;
      estimated_impact: string;
    }>;
    staffing_actions: Array<{
      department: string;
      action: string;
      role: string;
      count_change: number;
      reasoning: string;
    }>;
    inventory_actions: Array<{
      item: string;
      action: string;
      quantity_change: number;
      reasoning: string;
    }>;
    operational_recommendations: Array<{
      area: string;
      recommendation: string;
      timeline: string;
    }>;
  };
  analysis_triggered: string;
  next_analysis: string;
}

export const AutonomousAgentPanel = () => {
  const [analysis, setAnalysis] = useState<AutonomousAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoMode, setAutoMode] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runAnalysis = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch("http://127.0.0.1:8000/api/autonomous/analysis", {
        method: "GET"
      });
      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
        setLastCheck(new Date());
      } else {
        setError(data.message || "Failed to run analysis");
      }
    } catch (err) {
      setError("Unable to connect to autonomous agent");
      console.error("Autonomous analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkAgent = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/autonomous/check", {
        method: "GET"
      });
      const data = await response.json();
      
      if (data.success && data.result.analysis) {
        setAnalysis(data.result);
        setLastCheck(new Date());
      }
    } catch (err) {
      console.error("Autonomous check error:", err);
    }
  };

  useEffect(() => {
    // Initial check
    checkAgent();
    
    // Set up auto-checking if enabled
    let interval: NodeJS.Timeout;
    if (autoMode) {
      interval = setInterval(checkAgent, 5 * 60 * 1000); // Check every 5 minutes
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoMode]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical": return "bg-red-500 text-white";
      case "high": return "bg-red-400 text-white";
      case "medium": return "bg-yellow-400 text-black";
      case "low": return "bg-blue-400 text-white";
      default: return "bg-gray-400 text-white";
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "increase": return "text-green-600";
      case "decrease": return "text-red-600";
      case "maintain": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  const getTimelineColor = (timeline: string) => {
    switch (timeline.toLowerCase()) {
      case "immediate": return "bg-red-100 text-red-800";
      case "within_2h": return "bg-orange-100 text-orange-800";
      case "within_6h": return "bg-yellow-100 text-yellow-800";
      case "within_24h": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Autonomous AI Agent</h2>
            <p className="text-muted-foreground">Proactive hospital operations monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Auto Mode</span>
            <Switch checked={autoMode} onCheckedChange={setAutoMode} />
          </div>
          <Button 
            onClick={runAnalysis} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
            Run Analysis
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${autoMode ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="font-medium">
                Agent Status: {autoMode ? 'Active' : 'Paused'}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Last check: {lastCheck ? lastCheck.toLocaleTimeString() : 'Never'}
            </div>
          </div>
          {analysis && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Next scheduled analysis: {new Date(analysis.next_analysis).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Analysis Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Level</p>
                    <p className="text-xl font-bold">{analysis.surge_report.risk_level}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Target size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Surge Multiplier</p>
                    <p className="text-xl font-bold">{analysis.surge_report.overall_surge_multiplier}x</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Predicted Patients</p>
                    <p className="text-xl font-bold">{analysis.surge_report.total_predicted_patients}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Priority Alerts */}
          {analysis.ai_recommendations.priority_alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Priority Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.ai_recommendations.priority_alerts.map((alert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{alert.title}</h4>
                        <Badge className={getPriorityColor(alert.priority)}>
                          {alert.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Department: {alert.department}</span>
                        <span>Impact: {alert.estimated_impact}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staffing Actions */}
          {analysis.ai_recommendations.staffing_actions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={20} />
                  Staffing Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.ai_recommendations.staffing_actions.map((action, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{action.department} - {action.role}</span>
                        <span className={`font-bold ${getActionColor(action.action)}`}>
                          {action.action.toUpperCase()} {Math.abs(action.count_change)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{action.reasoning}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory Actions */}
          {analysis.ai_recommendations.inventory_actions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package size={20} />
                  Inventory Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.ai_recommendations.inventory_actions.map((action, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{action.item}</span>
                        <span className={`font-bold ${getActionColor(action.action)}`}>
                          {action.action.toUpperCase()} {Math.abs(action.quantity_change)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{action.reasoning}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Operational Recommendations */}
          {analysis.ai_recommendations.operational_recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings size={20} />
                  Operational Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.ai_recommendations.operational_recommendations.map((rec, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{rec.area}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{rec.recommendation}</p>
                        </div>
                        <Badge className={getTimelineColor(rec.timeline)}>
                          {rec.timeline.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Zap className="text-yellow-500 shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold mb-2">AI Analysis Summary</h4>
                  <p className="text-muted-foreground">{analysis.surge_report.summary}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Analysis completed: {new Date(analysis.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};