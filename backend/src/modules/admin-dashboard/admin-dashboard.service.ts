import { adminDashboardRepository } from "./admin-dashboard.repository";
import type { AdminDashboardStatsDTO } from "./admin-dashboard.dto";

export const adminDashboardService = {
  getStats(): Promise<AdminDashboardStatsDTO> {
    return adminDashboardRepository.getStats();
  },
};
