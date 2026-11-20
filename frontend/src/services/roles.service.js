import api from "../api/axios";

export const rolesService = {
  create: (data) => api.post("/roles", data),
  getAll: (skip = 0, take = 10) => api.get("/roles", { params: { skip, take } }),
  getById: (id) => api.get(`/roles/${id}`),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
};
