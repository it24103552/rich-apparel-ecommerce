import api from "../api/axios";

export const productsService = {
  create: (formData) =>
    api.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getAll: (skip = 0, take = 10, categoryId = null) =>
    api.get("/products", { params: { skip, take, categoryId } }),
  getPopular: (limit = 5) =>
    api.get("/products/popular", { params: { limit } }),
  getById: (id) => api.get(`/products/${id}`),
  update: (id, formData) =>
    api.put(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: (threshold = 10) =>
    api.get("/products/low-stock", { params: { threshold } }),
};
