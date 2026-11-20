import api from "../api/axios";

export const couponsService = {
  create: (data) => api.post("/coupons", data),
  getAll: (skip = 0, take = 10) => api.get("/coupons", { params: { skip, take } }),
  getAvailable: () => api.get("/coupons/available"),
  evaluate: (data) => api.post("/coupons/evaluate", data),
  getById: (id) => api.get(`/coupons/${id}`),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`),
};
