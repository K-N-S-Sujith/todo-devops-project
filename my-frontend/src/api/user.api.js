import api from "./axios";

export const updateProfile = (data) =>
  api.put("/user/profile", data);

export const changePassword = (data) =>
  api.put("/user/password", data);

export const getStats = () =>
  api.get("/user/stats");

export const deleteAccount = () =>
  api.delete("/user/delete");