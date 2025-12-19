import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001",
});

// ALWAYS attach token
api.interceptors.request.use((config) => {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {
    console.log("Token read error");
  }
  
  return config;
});

export default api;
