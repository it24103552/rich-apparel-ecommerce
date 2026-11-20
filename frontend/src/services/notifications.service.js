import axios from "axios";

const UNIVERSAL_API_URL = "http://localhost:5001/api/v1/notifications";

const getBaseUrl = (role) => {
    if (role === 'product manager') return `${UNIVERSAL_API_URL}/pm`;
    if (role === 'supplier manager') return `${UNIVERSAL_API_URL}/sm`;
    return UNIVERSAL_API_URL;
};

const getNotifications = async (role) => {
    const token = sessionStorage.getItem("token");
    return axios.get(getBaseUrl(role), {
        headers: { Authorization: `Bearer ${token}` }
    });
};

const markAsRead = async (id) => {
    const token = sessionStorage.getItem("token");
    return axios.patch(`${UNIVERSAL_API_URL}/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

const markAllAsRead = async (role) => {
    const token = sessionStorage.getItem("token");
    return axios.patch(`${getBaseUrl(role)}/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

const deleteNotification = async (id) => {
    const token = sessionStorage.getItem("token");
    return axios.delete(`${UNIVERSAL_API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

const clearAll = async (role) => {
    const token = sessionStorage.getItem("token");
    return axios.delete(`${getBaseUrl(role)}/clear-all`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const notificationsService = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
};
