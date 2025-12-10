import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Loader2, Sun, Utensils, Ban, Leaf, Droplets, 
  Moon, Shirt, AlertTriangle, Heart, Sparkles, RefreshCw 
} from "lucide-react";
import { getCitizenAIPlan } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface HealthPlan {
  weatherImpact: string;
  dietPlan: string[];
  avoidThese: string[];
  ayurvedicTips: string[];
  hydrationPlan: string[];
  sleepGuidance: string[];
  clothingSuggestions: string[];
  outdoorSafety: string[];
  mindBodyWellness: string[];
  dailySummary: string;
}

interface AIConsultationProps {
  userCoords: { lat: number; lon: number } | null;
}

const CACHE_KEY = 'citizen_health_plan';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const AIConsultation = ({ userCoords }: AIConsultationProps) => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<HealthPlan | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  // Load cached plan on component mount
  useEffect(() => {
    const cachedData = sessionStorage.getItem(CACHE_KEY);
    if (cachedData) {
      try {
        const { plan: cachedPlan, timestamp } = JSON.parse(cachedData);
        const now = new Date().getTime();
        
        // Check if cache is still valid (30 minutes)
        if (now - timestamp < CACHE_DURATION) {
          console.log("AIConsultation: Loading cached health plan");
          setPlan(cachedPlan);
          setLastGenerated(new Date(timestamp));
          return;
        } else {
          console.log("AIConsultation: Cache expired, clearing");
          sessionStorage.removeItem(CACHE_KEY);
        }
      } catch (e) {
        console.log("AIConsultation: Invalid cache, clearing");
        sessionStorage.removeItem(CACHE_KEY);
      }
    }
    
    // Only auto-generate if no valid cache
    console.log("AIConsultation: No valid cache, auto-generating plan");
    autoGeneratePlan();
  }, []);

  const autoGeneratePlan = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Use provided coordinates or fallback to Mumbai
      const coords = userCoords || { lat: 19.0760, lon: 72.8777 };
      
      const defaultMessage = "Give me today's complete health plan with all 9 sections: Weather Impact, Diet Plan, Avoid These, Ayurvedic Tips, Hydration Plan, Sleep Guidance, Clothing Suggestions, Outdoor Safety, and Mind & Body Wellness based on current weather";
      console.log("AI Consultation: generating comprehensive plan", { 
        message: defaultMessage, 
        lat: coords.lat, 
        lon: coords.lon 
      });
      
      const response = await getCitizenAIPlan(defaultMessage, coords.lat, coords.lon);
      console.log("AI Consultation: generated response", response.data);
      
      if (response.data.success && response.data.data) {
        const newPlan = response.data.data;
        const timestamp = new Date().getTime();
        
        // Cache the plan
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          plan: newPlan,
          timestamp
        }));
        
        setPlan(newPlan);
        setLastGenerated(new Date(timestamp));
      } else {
        setError("Failed to generate health plan. Please try again.");
      }
    } catch (err: any) {
      console.error("AI Consultation: generation error", err);
      setError(err.response?.data?.message || "Failed to generate health plan");
    } finally {
      setLoading(false);
    }
  };

  const handleGetPlan = async () => {
    if (!question.trim()) {
      setError("Please enter a question");
      return;
    }

    if (!userCoords) {
      setError("Location not available. Please enable location services.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      console.log("AI Consultation: sending request", { 
        message: question, 
        lat: userCoords.lat, 
        lon: userCoords.lon 
      });
      
      const response = await getCitizenAIPlan(question, userCoords.lat, userCoords.lon);
      console.log("AI Consultation: response", response.data);
      
      if (response.data.success && response.data.data) {
        setPlan(response.data.data);
      } else {
        setError("Failed to generate health plan. Please try again.");
      }
    } catch (err: any) {
      console.error("AI Consultation: error", err);
      setError(err.response?.data?.message || "Failed to generate health plan");
    } finally {
      setLoading(false);
    }
  };

  const sections = plan ? [
    { icon: Sun, title: "Weather Impact", content: plan.weatherImpact, color: "bg-yellow-50 border-yellow-200" },
    { icon: Utensils, title: "Diet Plan", content: plan.dietPlan, color: "bg-green-50 border-green-200" },
    { icon: Ban, title: "Avoid These", content: plan.avoidThese, color: "bg-red-50 border-red-200" },
    { icon: Leaf, title: "Ayurvedic Tips", content: plan.ayurvedicTips, color: "bg-emerald-50 border-emerald-200" },
    { icon: Droplets, title: "Hydration Plan", content: plan.hydrationPlan, color: "bg-blue-50 border-blue-200" },
    { icon: Moon, title: "Sleep Guidance", content: plan.sleepGuidance, color: "bg-indigo-50 border-indigo-200" },
    { icon: Shirt, title: "Clothing Suggestions", content: plan.clothingSuggestions, color: "bg-purple-50 border-purple-200" },
    { icon: AlertTriangle, title: "Outdoor Safety", content: plan.outdoorSafety, color: "bg-orange-50 border-orange-200" },
    { icon: Sparkles, title: "Mind & Body Wellness", content: plan.mindBodyWellness, color: "bg-pink-50 border-pink-200" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header with Regenerate Button */}
      {plan && (
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">AI Health Consultation</h2>
            {lastGenerated && (
              <p className="text-sm text-slate-600">
                Generated: {lastGenerated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <Button
            onClick={autoGeneratePlan}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {loading ? "Regenerating..." : "Regenerate Plan"}
          </Button>
        </div>
      )}

      {loading && !plan && (
        <div className="glass-card p-8 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-slate-600 font-medium">Generating your personalized health plan...</p>
        </div>
      )}

      {error && (
        <div className="glass-card p-6 bg-red-50 border-2 border-red-200">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {plan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Daily Summary Card */}
          <div className="glass-card p-6 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200">
            <div className="flex items-start gap-3">
              <Heart className="text-blue-600 shrink-0 mt-1" size={28} />
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Daily Summary</h3>
                <p className="text-base text-slate-700 leading-relaxed">{plan.dailySummary}</p>
              </div>
            </div>
          </div>

          {/* Accordion Sections */}
          <Accordion type="multiple" className="space-y-3">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const isArray = Array.isArray(section.content);
              
              return (
                <AccordionItem 
                  key={section.title} 
                  value={`item-${index}`}
                  className={`glass-card border-2 ${section.color} rounded-lg overflow-hidden`}
                >
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center shrink-0">
                        <Icon className="text-slate-700" size={22} />
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg">{section.title}</h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5">
                    {isArray ? (
                      <ul className="space-y-3 mt-2">
                        {(section.content as string[]).map((item, i) => (
                          <li key={i} className="text-base text-slate-700 flex items-start gap-3 leading-relaxed">
                            <span className="text-blue-600 shrink-0 font-bold text-lg">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-base text-slate-700 leading-relaxed mt-2">{section.content as string}</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </motion.div>
      )}
    </div>
  );
};
