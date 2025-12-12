import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Loader2, Sun, Utensils, Ban, Leaf, Droplets, 
  Moon, Shirt, AlertTriangle, Heart, Sparkles, RefreshCw, User 
} from "lucide-react";
import { getCitizenAIPlan } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface UserProfile {
  age: string;
  gender: string;
  healthConditions: string;
  dietaryPreferences: string;
  activityLevel: string;
  currentSymptoms: string;
}

interface AIConsultationProps {
  userCoords: { lat: number; lon: number } | null;
}

export const AIConsultation = ({ userCoords }: AIConsultationProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<HealthPlan | null>(null);



  const generatePersonalizedPlan = async () => {
    setLoading(true);
    setError("");
    setPlan(null);
    
    try {
      const coords = userCoords || { lat: 19.0760, lon: 72.8777 };
      const healthProfile = JSON.parse(localStorage.getItem('healthProfile') || '{}');
      
      let personalizedMessage;
      
      if (healthProfile.age && healthProfile.gender) {
        // Use complete profile
        personalizedMessage = `Create a personalized health plan for:
- Age: ${healthProfile.age}
- Gender: ${healthProfile.gender}
- Weight: ${healthProfile.weight || 'Not specified'}
- Health Conditions: ${healthProfile.healthConditions || 'None specified'}
- Activity Level: ${healthProfile.activityLevel || 'Moderate'}

Provide complete health plan with all 9 sections based on current weather and my personal profile.`;
      } else {
        // Generate general recommendations and suggest profile completion
        personalizedMessage = `Create a general health plan based on current weather conditions. Include a note that completing the Health Profile (age, gender, weight) will provide more personalized recommendations. Provide complete health plan with all 9 sections.`;
      }
      
      const response = await getCitizenAIPlan(personalizedMessage, coords.lat, coords.lon);
      
      if (response.data.success && response.data.data) {
        setPlan(response.data.data);
        
        // Show suggestion if profile is incomplete
        if (!healthProfile.age || !healthProfile.gender) {
          setError("💡 Tip: Complete your Health Profile for more personalized recommendations!");
        }
      } else {
        setError("Failed to generate health plan. Please try again.");
      }
    } catch (err: any) {
      setError("Failed to generate health plan. Please check your internet connection.");
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
      {/* Header */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">AI Health Consultation</h2>
          <p className="text-sm text-slate-600">Personalized health recommendations</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generatePersonalizedPlan}
            disabled={loading}
            variant="default"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Health Plan"
            )}
          </Button>
          {plan && (
            <Button
              onClick={generatePersonalizedPlan}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </Button>
          )}
        </div>
      </div>



      {loading && (
        <div className="glass-card p-8 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-slate-600 font-medium">Generating your personalized health plan...</p>
        </div>
      )}

      {error && (
        <div className={`glass-card p-6 border-2 ${
          error.includes('💡 Tip') 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <p className={`font-medium ${
            error.includes('💡 Tip') 
              ? 'text-blue-700' 
              : 'text-red-700'
          }`}>{error}</p>
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
