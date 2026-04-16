import api from "./axios";

export const getTodos = () => api.get("/todos");
export const createTodo = (data) => api.post("/todos", data);
export const getTodo = (id) => api.get(`/todos/${id}`);
export const updateTodo = (id, data) => api.put(`/todos/${id}`, data);
export const deleteTodo = (id) => api.delete(`/todos/${id}`);
export const toggleTodo = (id) => api.patch(`/todos/${id}/toggle`);