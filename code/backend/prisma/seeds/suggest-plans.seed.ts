import type { MealType } from "../../prisma/generated/prisma/client";
import { prisma } from "../../src/config/prisma";
import { NUTRIENT_NAMES } from "../../src/constants/nutrient-names";
import {
  SUGGEST_PLANS_SEED,
  type SuggestPlanSeed,
} from "./suggest-plans.data";

function templatePlanDate(planSeedIndex: number, dayIndex: number): Date {
  const offset = (planSeedIndex + 1) * 20 + dayIndex;
  const d = new Date("2099-01-01T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

async function deleteSeedPlanByName(name: string) {
  const existing = await prisma.suggestPlan.findFirst({
    where: { name },
    select: { suggest_plan_id: true },
  });
  if (!existing) return;

  const days = await prisma.suggestPlanDay.findMany({
    where: { suggest_plan_id: existing.suggest_plan_id },
    select: { daily_plan_id: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const day of days) {
      await tx.dailyPlan.delete({ where: { daily_plan_id: day.daily_plan_id } });
    }
    await tx.suggestPlan.delete({
      where: { suggest_plan_id: existing.suggest_plan_id },
    });
  });
}

async function loadDishIdMap(adminUserId: number): Promise<Map<string, number>> {
  const dishes = await prisma.dish.findMany({
    where: { created_by: adminUserId, is_global: true },
    select: { dish_id: true, dish_name: true },
  });
  return new Map(dishes.map((d) => [d.dish_name, d.dish_id]));
}

async function loadCalorieMap(): Promise<Map<number, number>> {
  const nutrient = await prisma.nutrient.findUnique({
    where: { name: NUTRIENT_NAMES.CALORIES },
    select: { nutrient_id: true },
  });
  if (!nutrient) return new Map();

  const rows = await prisma.dishNutrient.findMany({
    where: { nutrient_id: nutrient.nutrient_id },
    select: { dish_id: true, value: true },
  });
  return new Map(rows.map((r) => [r.dish_id, r.value]));
}

function estimateDayCalories(
  day: SuggestPlanSeed["days"][number],
  dishIds: Map<string, number>,
  calories: Map<number, number>,
): number {
  let total = 0;
  for (const meal of day.meals) {
    for (const item of meal.dishes) {
      const dishId = dishIds.get(item.dish_name);
      if (dishId == null) continue;
      total += (calories.get(dishId) ?? 0) * item.quantity;
    }
  }
  return Math.round(total);
}

async function seedOnePlan(
  plan: SuggestPlanSeed,
  planSeedIndex: number,
  adminUserId: number,
  dishIds: Map<string, number>,
) {
  await deleteSeedPlanByName(plan.name);

  await prisma.$transaction(async (tx) => {
    const created = await tx.suggestPlan.create({
      data: {
        name: plan.name,
        description: plan.description,
        day_count: plan.days.length,
        is_public: plan.is_public,
      },
      select: { suggest_plan_id: true },
    });

    for (let i = 0; i < plan.days.length; i++) {
      const dayIndex = i + 1;
      const day = plan.days[i];

      const dailyPlan = await tx.dailyPlan.create({
        data: {
          user_id: adminUserId,
          daily_plan_date: templatePlanDate(planSeedIndex, dayIndex),
          is_template: true,
        },
        select: { daily_plan_id: true },
      });

      await tx.suggestPlanDay.create({
        data: {
          suggest_plan_id: created.suggest_plan_id,
          daily_plan_id: dailyPlan.daily_plan_id,
          day_index: dayIndex,
        },
      });

      for (const mealSeed of day.meals) {
        const meal = await tx.meal.create({
          data: { meal_type: mealSeed.meal_type as MealType },
          select: { meal_id: true },
        });

        await tx.dailyMenu.create({
          data: {
            daily_plan_id: dailyPlan.daily_plan_id,
            meal_id: meal.meal_id,
          },
        });

        for (const item of mealSeed.dishes) {
          const dishId = dishIds.get(item.dish_name);
          if (dishId == null) {
            throw new Error(
              `[Suggest Plan Seed] Không tìm thấy món "${item.dish_name}" trong DB — chạy seedDishes trước.`,
            );
          }

          await tx.mealMenu.create({
            data: {
              meal_id: meal.meal_id,
              dish_id: dishId,
              quantity: item.quantity,
            },
          });
        }
      }
    }
  });
}

export async function seedSuggestPlans(adminUserId: number) {
  console.log("[Suggest Plan Seed] Đang nạp thực đơn gợi ý demo...");

  const dishIds = await loadDishIdMap(adminUserId);
  if (dishIds.size === 0) {
    console.log("[Suggest Plan Seed] Chưa có món global — bỏ qua.");
    return;
  }

  const calorieMap = await loadCalorieMap();

  for (let i = 0; i < SUGGEST_PLANS_SEED.length; i++) {
    const plan = SUGGEST_PLANS_SEED[i];
    await seedOnePlan(plan, i, adminUserId, dishIds);

    const dayCals = plan.days.map((day, idx) => {
      const kcal = estimateDayCalories(day, dishIds, calorieMap);
      return `Ngày ${idx + 1}: ~${kcal} kcal`;
    });
    console.log(`[Suggest Plan Seed] ${plan.name} (${plan.days.length} ngày)`);
    console.log(`  ${dayCals.join(" | ")}`);
  }

  console.log(`[Suggest Plan Seed] Đã nạp ${SUGGEST_PLANS_SEED.length} thực đơn gợi ý.`);
}
