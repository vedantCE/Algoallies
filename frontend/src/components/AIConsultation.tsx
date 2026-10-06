import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Loader2, Sun, Utensils, Ban, Leaf, Droplets, 
  Moon, Shirt, AlertTriangle, Heart, Sparkles, RefreshCw, User, Info, Wand2,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { isProfileComplete, loadHealthProfile } from "@/lib/health-profile";
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
  onOpenProfile?: () => void;
}

export const AIConsultation = ({ userCoords, onOpenProfile }: AIConsultationProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<HealthPlan | null>(null);
  const profileComplete = isProfileComplete(loadHealthProfile());

  const generatePersonalizedPlan = async () => {
    setLoading(true);
    setError("");
    setPlan(null);

    try {
      const coords = userCoords || { lat: 19.0760, lon: 72.8777 };
      const healthProfile = loadHealthProfile();

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
      } else {
        setError("We couldn't generate your health plan. Please try again.");
      }
    } catch (err: any) {
      setError("We couldn't reach the server. Check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const sections = plan ? [
    { icon: Sun, title: "Weather Impact", content: plan.weatherImpact, tint: "bg-amber-100 text-amber-800" },
    { icon: Utensils, title: "Diet Plan", content: plan.dietPlan, tint: "bg-emerald-100 text-emerald-800" },
    { icon: Ban, title: "Avoid These", content: plan.avoidThese, tint: "bg-red-100 text-red-800" },
    { icon: Leaf, title: "Ayurvedic Tips", content: plan.ayurvedicTips, tint: "bg-green-100 text-green-800" },
    { icon: Droplets, title: "Hydration Plan", content: plan.hydrationPlan, tint: "bg-sky-100 text-sky-800" },
    { icon: Moon, title: "Sleep Guidance", content: plan.sleepGuidance, tint: "bg-indigo-100 text-indigo-800" },
    { icon: Shirt, title: "Clothing Suggestions", content: plan.clothingSuggestions, tint: "bg-violet-100 text-violet-800" },
    { icon: AlertTriangle, title: "Outdoor Safety", content: plan.outdoorSafety, tint: "bg-orange-100 text-orange-800" },
    { icon: Sparkles, title: "Mind & Body Wellness", content: plan.mindBodyWellness, tint: "bg-pink-100 text-pink-800" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Wand2 size={22} aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Your daily health plan</h2>
            <p className="text-sm text-muted-foreground">
              {profileComplete ? "Personalised to your profile and local weather" : "Based on your local weather"}
            </p>
          </div>
        </div>
        <Button onClick={generatePersonalizedPlan} disabled={loading} className="h-11">
          {loading ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : plan ? (
            <RefreshCw aria-hidden="true" />
          ) : (
            <Sparkles aria-hidden="true" />
          )}
          {loading ? "Generating…" : plan ? "Regenerate plan" : "Generate health plan"}
        </Button>
      </div>

      {!profileComplete && (
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-accent p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 shrink-0 text-accent-foreground" size={20} aria-hidden="true" />
            <p className="text-sm text-accent-foreground">
              Add your age and gender to your health profile for more personalised recommendations.
            </p>
          </div>
          {onOpenProfile && (
            <Button variant="outline" size="sm" onClick={onOpenProfile} className="shrink-0 bg-card">
              <User aria-hidden="true" />
              Complete profile
            </Button>
          )}
        </div>
      )}

      <div aria-live="polite" aria-busy={loading}>
        {loading && (
          <div className="space-y-3" aria-label="Generating your health plan">
            <div className="glass-card h-28 animate-pulse bg-muted/60" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="glass-card h-16 animate-pulse bg-muted/60" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-destructive" size={20} aria-hidden="true" />
              <p className="text-sm text-foreground">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={generatePersonalizedPlan} className="shrink-0">
              <RefreshCw aria-hidden="true" />
              Try again
            </Button>
          </div>
        )}

        {!plan && !loading && !error && (
          <div className="glass-card">
            <EmptyState
              icon={Heart}
              title="Get guidance for today"
              description="Generate a plan covering diet, hydration, sleep, clothing and outdoor safety based on today's weather."
            />
          </div>
        )}

        {plan && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-4"
          >
            {/* Daily Summary Card */}
            <div className="glass-card border-primary/20 bg-gradient-to-br from-accent to-healthcare-light-green p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                  <Heart size={22} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Daily summary</h3>
                  <p className="leading-relaxed text-foreground/85">{plan.dailySummary}</p>
                </div>
              </div>
            </div>

            {/* Accordion Sections */}
            <Accordion type="multiple" defaultValue={["item-0"]} className="space-y-3">
              {sections.map((section, index) => {
                const Icon = section.icon;
                const isArray = Array.isArray(section.content);

                return (
                  <AccordionItem
                    key={section.title}
                    value={`item-${index}`}
                    className="glass-card overflow-hidden border-b-0"
                  >
                    <AccordionTrigger className="px-5 py-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${section.tint}`}>
                          <Icon size={20} aria-hidden="true" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5">
                      {isArray ? (
                        <ul className="mt-1 space-y-2.5">
                          {(section.content as string[]).map((item, i) => (
                            <li key={i} className="flex items-start gap-3 leading-relaxed text-foreground/85">
                              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 leading-relaxed text-foreground/85">{section.content as string}</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            <p className="text-xs text-muted-foreground">
              AI-generated guidance is informational and not a substitute for professional medical advice.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
