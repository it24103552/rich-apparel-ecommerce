import api from "../api/axios";

export const paymentsService = {
  create: (data) =>
    api.post("/payments", data, data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined),
  getAll: (skip = 0, take = 10) => api.get("/payments", { params: { skip, take } }),
  getById: (id) => api.get(`/payments/${id}`),
  updateStatus: (id, data) => api.put(`/payments/${id}/status`, data),
  delete: (id) => api.delete(`/payments/${id}`),
};
