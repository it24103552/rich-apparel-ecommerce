import api from "../api/axios";

export const aiService = {
    generateCategoryDescription: (name) => api.get("ai/generate-category-description", { params: { name } }),
    generateProductDescription: (name) => api.get("ai/generate-product-description", { params: { name } }),
    generateImage: (name) => api.get("ai/generate-image", { params: { name } }),
};
