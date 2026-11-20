import api from "../api/axios";

export const orderDiscountService = {
  applyDiscount: (orderId, data) =>
    api.post(`/orders/${orderId}/apply-discount`, data),

  saveDiscount: (orderId, data) =>
    api.post(`/orders/${orderId}/save-discount`, data),

  getDiscount: (orderId) =>
    api.get(`/orders/${orderId}/discount`)
};
