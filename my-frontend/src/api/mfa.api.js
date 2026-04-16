import api from "./axios";

export const setupMFA = () => api.post("/mfa/setup");
export const enableMFA = (token) => api.post("/mfa/enable", { token });
export const disableMFA = (token) => api.post("/mfa/disable", { token });
export const getMFAStatus = () => api.get("/mfa/status");