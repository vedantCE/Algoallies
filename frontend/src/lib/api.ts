import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000",
});

export const sendCitizenMessage = (message: string) =>
  api.post("/citizen-response", { message });

export const sendHospitalMessage = (query: string) =>
  api.post("/hospital-response", { query });

export const getLandingAI = () =>
  api.post("/landing-response", {});

export const getHealthAdvisory = () =>
  api.get("/health-advisory");

export const getNearbyHospitals = () =>
  api.get("/nearby-hospitals");

export const login = (email: string, password: string) =>
  api.post("/login", { email, password });

export const signup = (data: { email: string; password: string; role: string }) =>
  api.post("/signup", data);

// Citizen AI Plan
export const getCitizenAIPlan = (message: string, lat: number, lon: number) =>
  api.post("/citizenai", { message, lat, lon });

// Weather API
export const getWeather = (lat: number, lon: number) =>
  api.post("/weather/complete", { lat, lon });

// Hospital Staff APIs
export const getStaff = (lat?: number, lon?: number) =>
  api.get("/api/staff", { params: { lat, lon } });

export const getStaffRecommendations = (lat?: number, lon?: number) =>
  api.post("/api/staff/recommendations", { lat, lon });

// Hospital Inventory APIs
export const getInventory = (lat?: number, lon?: number) =>
  api.get("/api/inventory", { params: { lat, lon } });

export const updateInventoryStatus = (itemId: string, status: string) =>
  api.patch(`/api/inventory/${itemId}/status`, { item_id: itemId, status });

export const recalculateInventory = (lat?: number, lon?: number) =>
  api.post("/api/inventory/recalculate", { lat, lon });

// Hospital Reports
export const getDecisionReports = () =>
  api.get("/api/reports/decisions");

// Hospital Settings
export const getHospitalSettings = () =>
  api.get("/api/settings");

// Patient Statistics
export const getPatientStats = (lat?: number, lon?: number) =>
  api.get("/api/patients/stats", { params: { lat, lon } });

// Surge Prediction
export const getSurgePrediction = (lat?: number, lon?: number, city?: string) =>
  api.get("/api/surge/prediction", { params: { lat, lon, city } });
