import api from "../api/axios";

export const categoriesService = {
  create: (data) => api.post("/categories", data),
  getAll: (skip = 0, take = 10, activeOnly = false) => api.get("/categories", { params: { skip, take, activeOnly } }),
  getById: (id) => api.get(`/categories/${id}`),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};
