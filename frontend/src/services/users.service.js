import api from "../api/axios";

export const usersService = {
  getAll: (skip = 0, take = 10) => api.get("/users", { params: { skip, take } }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  updatePassword: (id, password) => api.put(`/users/${id}/password`, { password }),
  requestPasswordChange: () => api.post(`/users/request-password-change`),
  delete: (id) => api.delete(`/users/${id}`),
  getPasswordRequests: () => api.get("/users/password-requests"),
  deletePasswordRequest: (id) => api.delete(`/users/password-requests/${id}`),
};
