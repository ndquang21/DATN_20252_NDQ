import { api } from "./api";
import type { AdminDashboardStats } from "../types/adminDashboard";

export const adminDashboardService = {
  getStats() {
    return api.get<AdminDashboardStats>("/admin/dashboard/stats");
  },
};