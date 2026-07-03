import { Role } from "../../../prisma/generated/prisma/client";

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
