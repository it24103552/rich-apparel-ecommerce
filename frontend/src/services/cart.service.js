import api from "../api/axios";

export const cartService = {
  addItem: (data) => api.post("/cart", data),
  getCart: () => api.get("/cart"),
  updateItem: (itemId, data) => api.put(`/cart/${itemId}`, data),
  removeItem: (itemId) => api.delete(`/cart/${itemId}`),
};
