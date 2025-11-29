import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
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