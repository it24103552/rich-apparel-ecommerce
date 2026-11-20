import api from "../api/axios";

export const loyaltyService = {
  addPoints: (data) => api.post("/loyalty", data),
  getBalance: () => api.get("/loyalty"),
  getHistory: (skip = 0, take = 10) => api.get(`/loyalty/history?skip=${skip}&take=${take}`),
  getAll: (skip = 0, take = 10) => api.get(`/loyalty/all?skip=${skip}&take=${take}`),
  update: (id, data) => api.put(`/loyalty/${id}`, data),
  delete: (id) => api.delete(`/loyalty/${id}`)
};
