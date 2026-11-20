import api from "../api/axios";

export const dashboardService = {
  getDashboardData: () => api.get("/dashboard"),
  getSupplierDashboardData: () => api.get("/dashboard/supplier"),
  getAdminOverallData: () => api.get("/dashboard/overall"),
};
