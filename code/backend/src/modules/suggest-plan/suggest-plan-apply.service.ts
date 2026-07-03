import { MealType } from "../../../prisma/generated/prisma/client";
import { NUTRIENT_NAMES } from "../../constants/nutrient-names";
import { dailyPlanRepository } from "../daily-plan/daily-plan.repository";
import { dailyPlanService } from "../daily-plan/daily-plan.service";
import { userRepository } from "../user/user.repository";
import { userService } from "../user/user.service";
import { suggestPlanRepository } from "./suggest-plan.repository";
import { parseDateOnly, formatDateOnly } from "../../utils/date.util";
import type {
  ApplySuggestPlanBodyDTO,
  ApplySuggestPlanResponseDTO,
} from "./suggest-plan.dto";

const N_CAL = NUTRIENT_NAMES.CALORIES;

type TemplateDailyPlan = NonNullable<
  Awaited<ReturnType<typeof suggestPlanRepository.findPublicByIdWithDays>>
>["suggest_plan_days"][number]["daily_plan"];

type ApplyResult =
  | { ok: true; data: ApplySuggestPlanResponseDTO }
  | {
      ok: false;
      reason: "not_found" | "profile_incomplete" | "invalid_day" | "invalid_meal";
    };

function addDays(dateStr: string, offset: number): string {
  const d = parseDateOnly(dateStr);
  d.setUTCDate(d.getUTCDate() + offset);
  return formatDateOnly(d);
}

function scaleGrams(originalGrams: number, factor: number): number {
  const g = Math.round(originalGrams);
  if (g < 30) return g;
  return Math.floor((g * factor) / 5) * 5;
}

function quantityFromGrams(grams: number): number {
  const g = Math.round(grams);
  return g / 100;
}

function readGramsFromQuantity(quantity: number): number {
  return Math.round(quantity * 100);
}

function templateDayCalories(dailyPlan: TemplateDailyPlan): number {
  let total = 0;
  for (const dm of dailyPlan.daily_menus) {
    for (const mm of dm.meal.meal_menus) {
      const cal =
        (mm.dish.dish_nutrients.find((dn) => dn.nutrient.name === N_CAL)
          ?.value ?? 0) * mm.quantity;
      total += cal;
    }
  }
  return total;
}

function extractDishes(
  meal: TemplateDailyPlan["daily_menus"][number]["meal"],
  scaleFactor: number | null,
) {
  return meal.meal_menus.map((mm) => {
    const originalGrams = readGramsFromQuantity(mm.quantity);
    const grams =
      scaleFactor === null
        ? originalGrams
        : scaleGrams(originalGrams, scaleFactor);
    return {
      dishId: mm.dish.dish_id,
      quantity: quantityFromGrams(grams),
    };
  });
}

async function resolveUserTdee(userId: number): Promise<number | null> {
  const user = await userRepository.findById(userId);
  if (!user) return null;
  if (user.TDEE != null && user.TDEE > 0) return user.TDEE;
  const metrics = userService.calculateTdee(user);
  return metrics?.tdee ?? null;
}

async function applyTemplateMealToUserDay(
  userId: number,
  targetDate: Date,
  templateMeal: TemplateDailyPlan["daily_menus"][number]["meal"],
  targetMealType: MealType,
  scaleFactor: number | null,
  clearExistingMeal = true,
): Promise<void> {
  const dishes = extractDishes(templateMeal, scaleFactor);
  if (dishes.length === 0) return;

  if (!clearExistingMeal) {
    await dailyPlanRepository.createMealWithDishes(
      userId,
      targetDate,
      targetMealType,
      dishes,
    );
    return;
  }

  if (targetMealType === "snack") {
    await dailyPlanRepository.deleteUserMealsByTypeOnDate(
      userId,
      targetDate,
      "snack",
    );
    await dailyPlanRepository.createMealWithDishes(
      userId,
      targetDate,
      "snack",
      dishes,
    );
    return;
  }

  const existing = await dailyPlanRepository.findUserMealByTypeOnDate(
    userId,
    targetDate,
    targetMealType,
  );

  if (existing) {
    await dailyPlanRepository.deleteUserMeal(existing.mealId);
  }

  await dailyPlanRepository.createMealWithDishes(
    userId,
    targetDate,
    targetMealType,
    dishes,
    existing?.dailyPlanId,
  );
}

async function applyTemplateDayToUser(
  userId: number,
  templateDay: TemplateDailyPlan,
  targetDate: Date,
  userTdee: number,
): Promise<void> {
  await dailyPlanRepository.clearUserDay(userId, targetDate);

  const dayCal = templateDayCalories(templateDay);
  const scaleFactor = dayCal > 0 ? userTdee / dayCal : 1;

  for (const dm of templateDay.daily_menus) {
    await applyTemplateMealToUserDay(
      userId,
      targetDate,
      dm.meal,
      dm.meal.meal_type,
      scaleFactor,
      false,
    );
  }
}

function findTemplateDay(
  plan: NonNullable<
    Awaited<ReturnType<typeof suggestPlanRepository.findPublicByIdWithDays>>
  >,
  dayIndex: number,
): TemplateDailyPlan | null {
  const row = plan.suggest_plan_days.find((d) => d.day_index === dayIndex);
  return row?.daily_plan ?? null;
}

function findTemplateMeal(
  plan: NonNullable<
    Awaited<ReturnType<typeof suggestPlanRepository.findPublicByIdWithDays>>
  >,
  mealId: number,
): TemplateDailyPlan["daily_menus"][number]["meal"] | null {
  for (const day of plan.suggest_plan_days) {
    for (const dm of day.daily_plan.daily_menus) {
      if (dm.meal.meal_id === mealId) return dm.meal;
    }
  }
  return null;
}

export const suggestPlanApplyService = {
  async apply(
    userId: number,
    suggestPlanId: number,
    body: ApplySuggestPlanBodyDTO,
  ): Promise<ApplyResult> {
    const plan =
      await suggestPlanRepository.findPublicByIdWithDays(suggestPlanId);
    if (!plan) return { ok: false, reason: "not_found" };

    const userTdee = await resolveUserTdee(userId);
    if (!userTdee) return { ok: false, reason: "profile_incomplete" };

    const affectedDates: string[] = [];

    if (body.scope === "plan") {
      for (const day of plan.suggest_plan_days) {
        const targetDateStr = addDays(body.startDate, day.day_index - 1);
        const targetDate = parseDateOnly(targetDateStr);
        await applyTemplateDayToUser(
          userId,
          day.daily_plan,
          targetDate,
          userTdee,
        );
        affectedDates.push(targetDateStr);
      }
    } else if (body.scope === "day") {
      const templateDay = findTemplateDay(plan, body.sourceDayIndex);
      if (!templateDay) return { ok: false, reason: "invalid_day" };

      const targetDate = parseDateOnly(body.targetDate);
      await applyTemplateDayToUser(
        userId,
        templateDay,
        targetDate,
        userTdee,
      );
      affectedDates.push(body.targetDate);
    } else {
      const templateMeal = findTemplateMeal(plan, body.sourceMealId);
      if (!templateMeal) return { ok: false, reason: "invalid_meal" };

      const targetDate = parseDateOnly(body.targetDate);
      await applyTemplateMealToUserDay(
        userId,
        targetDate,
        templateMeal,
        body.targetMealType,
        null,
      );
      affectedDates.push(body.targetDate);
    }

    return {
      ok: true,
      data: {
        affectedDates,
        plans: await Promise.all(
          affectedDates.map((date) =>
            dailyPlanService.getDailyPlan(userId, date),
          ),
        ),
      },
    };
  },
};