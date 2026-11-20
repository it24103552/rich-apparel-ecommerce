import api from "../api/axios";

export const returnsService = {
  create: (data) => api.post("/returns", data),
  getAll: (skip = 0, take = 10) => api.get("/returns", { params: { skip, take } }),
  getById: (id) => api.get(`/returns/${id}`),
  updateStatus: (id, data) => api.put(`/returns/${id}/status`, data),
  cancel: (id) => api.delete(`/returns/${id}/cancel`),
  delete: (id) => api.delete(`/returns/${id}`),
};
