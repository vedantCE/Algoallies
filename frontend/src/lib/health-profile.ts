// Read by AIConsultation to personalise the generated health plan.
const STORAGE_KEY = "healthProfile";

export interface HealthProfile {
  name?: string;
  age?: string;
  gender?: string;
  weight?: string;
  healthConditions?: string;
  activityLevel?: string;
}

export function loadHealthProfile(): HealthProfile {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveHealthProfile(profile: HealthProfile) {
  try {
    const merged = { ...loadHealthProfile(), ...profile };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Storage can be unavailable (private mode); the profile just won't persist
  }
}

export function isProfileComplete(p: HealthProfile) {
  return Boolean(p.age && p.gender);
}
