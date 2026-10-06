import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { HealthProfile, loadHealthProfile, saveHealthProfile } from "@/lib/health-profile";

interface HealthProfileFormProps {
  onSaved?: () => void;
}

export const HealthProfileForm = ({ onSaved }: HealthProfileFormProps) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<HealthProfile>(() => loadHealthProfile());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ age?: string; weight?: string }>({});

  const update = (field: keyof HealthProfile, value: string) =>
    setProfile((p) => ({ ...p, [field]: value }));

  const validate = () => {
    const next: typeof errors = {};
    const age = Number(profile.age);
    if (profile.age && (!Number.isFinite(age) || age < 1 || age > 120)) {
      next.age = "Enter an age between 1 and 120.";
    }
    const weight = Number(profile.weight);
    if (profile.weight && (!Number.isFinite(weight) || weight < 2 || weight > 400)) {
      next.weight = "Enter a weight between 2 and 400 kg.";
    }
    setErrors(next);
    return next;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    if (found.age || found.weight) {
      // Focus the first invalid field
      document.getElementById(found.age ? "profile-age" : "profile-weight")?.focus();
      return;
    }
    setSaving(true);
    saveHealthProfile(profile);
    // Short delay so the save feels acknowledged rather than instant/no-op
    setTimeout(() => {
      setSaving(false);
      toast({ title: "Profile saved", description: "Your AI health plans will now be personalised." });
      onSaved?.();
    }, 300);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="glass-card p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Your details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Used only to personalise your AI health plan. Stored on this device.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="profile-name">Name</Label>
          <Input
            id="profile-name"
            autoComplete="name"
            value={profile.name ?? ""}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Asha Sharma"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-age">
            Age <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id="profile-age"
            type="number"
            inputMode="numeric"
            min={1}
            max={120}
            value={profile.age ?? ""}
            onChange={(e) => update("age", e.target.value)}
            onBlur={validate}
            aria-invalid={Boolean(errors.age)}
            aria-describedby={errors.age ? "profile-age-error" : undefined}
            className="h-11"
          />
          {errors.age && (
            <p id="profile-age-error" role="alert" className="text-sm text-destructive">
              {errors.age}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-gender">
            Gender <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Select value={profile.gender ?? ""} onValueChange={(v) => update("gender", v)}>
            <SelectTrigger id="profile-gender" className="h-11">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-weight">Weight (kg)</Label>
          <Input
            id="profile-weight"
            type="number"
            inputMode="decimal"
            value={profile.weight ?? ""}
            onChange={(e) => update("weight", e.target.value)}
            onBlur={validate}
            aria-invalid={Boolean(errors.weight)}
            aria-describedby={errors.weight ? "profile-weight-error" : undefined}
            className="h-11"
          />
          {errors.weight && (
            <p id="profile-weight-error" role="alert" className="text-sm text-destructive">
              {errors.weight}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-activity">Activity level</Label>
          <Select value={profile.activityLevel ?? ""} onValueChange={(v) => update("activityLevel", v)}>
            <SelectTrigger id="profile-activity" className="h-11">
              <SelectValue placeholder="Select activity level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sedentary">Sedentary</SelectItem>
              <SelectItem value="Light">Light</SelectItem>
              <SelectItem value="Moderate">Moderate</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="profile-conditions">Health conditions</Label>
          <Textarea
            id="profile-conditions"
            value={profile.healthConditions ?? ""}
            onChange={(e) => update("healthConditions", e.target.value)}
            placeholder="e.g. asthma, type 2 diabetes"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">Optional. Separate multiple conditions with commas.</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-6">
        <p className="mr-auto text-xs text-muted-foreground">
          <span className="text-destructive" aria-hidden="true">*</span> Required for a personalised plan
        </p>
        <Button type="submit" disabled={saving} className="min-w-[120px] h-11">
          {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
};
