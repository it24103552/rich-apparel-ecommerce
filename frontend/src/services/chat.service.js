import API from "../api/axios";

const chatService = {
  sendMessage: async (data) => {
    // If it's a FormData object (for images), axios handles it
    const response = await API.post("/chat/send", data, {
      headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {}
    });
    return response.data;
  },

  getChatHistory: async (userId) => {
    const response = await API.get(`/chat/history/${userId}`);
    return response.data;
  },

  clearChatUI: async () => {
    const response = await API.post("/chat/clear");
    return response.data;
  },

  getAdminGroups: async () => {
    const response = await API.get("/chat/admin/groups");
    return response.data;
  },

  markAsRead: async (customerId) => {
    const response = await API.patch(`/chat/admin/read/${customerId}`);
    return response.data;
  },
};

export default chatService;
