import type { UserRole } from "./adminUser";

export type AdminDashboardRecentUser = {
  user_id: number;
  username: string;
  role: UserRole;
  created_at: string;
};

export type AdminDashboardRecentSuggestPlan = {
  suggestPlanId: number;
  name: string;
  isPublic: boolean;
  updatedAt: string;
  dayCount: number;
};

export type AdminDashboardStats = {
  userCount: number;
  globalDishCount: number;
  suggestPlanCount: number;
  suggestPlanPublicCount: number;
  nutrientCount: number;
  recentUsers: AdminDashboardRecentUser[];
  recentSuggestPlans: AdminDashboardRecentSuggestPlan[];
};