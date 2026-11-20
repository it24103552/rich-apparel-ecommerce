import api from "../api/axios";

export const staffService = {
  create: (data) => api.post("/staff", data),
  getAll: (skip = 0, take = 10) => api.get("/staff", { params: { skip, take } }),
  getById: (id) => api.get(`/staff/${id}`),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`),
};
