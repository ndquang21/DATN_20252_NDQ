import { Role } from "../../../prisma/generated/prisma/client";
import { adminDashboardRepository } from "./admin-dashboard.repository";

export type AdminDashboardRecentUserDTO = {
  user_id: number;
  username: string;
  role: Role;
  created_at: Date;
};

export type AdminDashboardRecentSuggestPlanDTO = {
  suggestPlanId: number;
  name: string;
  isPublic: boolean;
  updatedAt: Date;
  dayCount: number;
};

export type AdminDashboardStatsDTO = {
  userCount: number;
  globalDishCount: number;
  suggestPlanCount: number;
  suggestPlanPublicCount: number;
  nutrientCount: number;
  recentUsers: AdminDashboardRecentUserDTO[];
  recentSuggestPlans: AdminDashboardRecentSuggestPlanDTO[];
};

export const adminDashboardService = {
  getStats(): Promise<AdminDashboardStatsDTO> {
    return adminDashboardRepository.getStats();
  },
};