import api from "../api/axios";

export const reviewsService = {
  create: (formData) =>
    api.post("/reviews", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getAll: (skip = 0, take = 10) => api.get("/reviews", { params: { skip, take } }),
  getMine: (skip = 0, take = 10) => api.get("/reviews/mine", { params: { skip, take } }),
  getById: (id) => api.get(`/reviews/${id}`),
  update: (id, formData) =>
    api.put(`/reviews/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/reviews/${id}`),
};
