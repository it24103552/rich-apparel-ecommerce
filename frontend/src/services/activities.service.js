import api from "../api/axios";

const getBaseUrl = (role) => {
    if (role === 'product manager') return "/activities/pm";
    if (role === 'supplier manager') return "/activities/sm";
    return "/activities";
};

export const activitiesService = {
    getAll: (skip = 0, take = 50, search = "", role = null) =>
        api.get(getBaseUrl(role), { params: { skip, take, search } }),
    getByUser: (userId, skip = 0, take = 50) =>
        api.get(`/activities/user/${userId}`, { params: { skip, take } }),
    clearAll: (role = null) => api.delete(getBaseUrl(role)),
    deleteById: (id) => api.delete(`/activities/${id}`),
};
