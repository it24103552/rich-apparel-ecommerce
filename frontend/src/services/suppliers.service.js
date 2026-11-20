import api from "../api/axios";

export const suppliersService = {
  create: (data) => api.post("/suppliers", data),
  getAll: (skip = 0, take = 10) => api.get("/suppliers", { params: { skip, take } }),
  getById: (id) => api.get(`/suppliers/${id}`),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};
