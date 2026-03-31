import { prisma } from "../../config/prisma";

const RECENT_LIMIT = 6;

export const adminDashboardRepository = {
  getStats() {
    return Promise.all([
      prisma.user.count(),
      prisma.dish.count({ where: { is_global: true } }),
      prisma.suggestPlan.count(),
      prisma.suggestPlan.count({ where: { is_public: true } }),
      prisma.nutrient.count(),
      prisma.user.findMany({
        orderBy: { created_at: "desc" },
        take: RECENT_LIMIT,
        select: {
          user_id: true,
          username: true,
          role: true,
          created_at: true,
        },
      }),
      prisma.suggestPlan.findMany({
        orderBy: { updated_at: "desc" },
        take: RECENT_LIMIT,
        select: {
          suggest_plan_id: true,
          name: true,
          is_public: true,
          updated_at: true,
          day_count: true,
        },
      }),
    ]).then(
      ([
        userCount,
        globalDishCount,
        suggestPlanCount,
        suggestPlanPublicCount,
        nutrientCount,
        recentUsers,
        recentSuggestPlans,
      ]) => ({
        userCount,
        globalDishCount,
        suggestPlanCount,
        suggestPlanPublicCount,
        nutrientCount,
        recentUsers,
        recentSuggestPlans: recentSuggestPlans.map((p) => ({
          suggestPlanId: p.suggest_plan_id,
          name: p.name,
          isPublic: p.is_public,
          updatedAt: p.updated_at,
          dayCount: p.day_count,
        })),
      }),
    );
  },
};