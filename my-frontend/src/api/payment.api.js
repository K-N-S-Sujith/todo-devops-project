import api from "./axios";

export const getPlans = () => api.get("/payments/plans");
export const createOrder = (data) => api.post("/payments/create-order", data);
export const verifyPayment = (data) => api.post("/payments/verify", data);
export const getHistory = () => api.get("/payments/history");