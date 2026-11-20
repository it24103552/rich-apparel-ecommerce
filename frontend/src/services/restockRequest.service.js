import api from "../api/axios";

export const restockRequestService = {
  create: (data) => api.post("/restock-requests", data),
  getAll: (skip = 0, take = 10) => api.get(`/restock-requests?skip=${skip}&take=${take}`),
  getById: (id) => api.get(`/restock-requests/${id}`),
  updateStatus: (id, status, fulfillment = null) => api.patch(`/restock-requests/${id}/status`, { status, fulfillment }),
  approve: (id) => api.patch(`/restock-requests/${id}/approve`),
  process: (id) => api.patch(`/restock-requests/${id}/process`),
  complete: (id) => api.patch(`/restock-requests/${id}/complete`),
  addToStock: (id) => api.patch(`/restock-requests/${id}/add-to-stock`),
};
