import api from "../api/axios";

export const ordersService = {
  create: (data) => api.post("/orders", data),
  getAll: (skip = 0, take = 10) => api.get("/orders", { params: { skip, take } }),
  getById: (id) => api.get(`/orders/${id}`),
  update: (id, data) => api.put(`/orders/${id}`, data),
  cancel: (id) => api.delete(`/orders/${id}/cancel`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  processRefund: (id) => api.post(`/orders/${id}/refund`),
  delete: (id) => api.delete(`/orders/${id}`),
  createReturnOrder: (data) => api.post("/orders/return-replacement", data),
};
