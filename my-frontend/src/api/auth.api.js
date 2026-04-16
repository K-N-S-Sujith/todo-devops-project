import api from "./axios";

export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);
export const getMe = () => api.get("/auth/me");
export const logout = () => api.post("/auth/logout");

// Google OAuth redirect
export const googleLogin = () => {
   window.location.href = "http://localhost:5000/api/auth/google";
};