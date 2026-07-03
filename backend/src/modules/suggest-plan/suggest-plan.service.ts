import { MealType } from "../../../prisma/generated/prisma/client";
import { round2, buildMealsAndSummary } from "../../utils/meal.util";

import {
  DailyPlanSummaryDTO,
  MealItemDTO,
  MealNutrientsDTO,
  NutrientValueDTO,
} from "../daily-plan/daily-plan.dto";
import { dailyPlanRepository } from "../daily-plan/daily-plan.repository";

import type {
  AddSuggestPlanDayResponseDTO,
  CreateSuggestPlanResponseDTO,
  PublishSuggestPlanResponseDTO,
  RemoveSuggestPlanDayResponseDTO,
  SuggestPlanDetailDTO,
  SuggestPlanDayDTO,
  SuggestPlanListItemDTO,
  SuggestPlanListResponseDTO,
  UpdateSuggestPlanBodyDTO,
  SuggestPlanPublicDetailDTO,
  SuggestPlanPublicListItemDTO,
  SuggestPlanPublicListResponseDTO,
  SuggestPlanPublicDayDTO,
  SuggestPlanDayNutrientsDTO,
} from "./suggest-plan.dto";
import { suggestPlanRepository, type SuggestPlanListSort, } from "./suggest-plan.repository";

const REQUIRED_MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

type RawDishNutrient = {
  value: number;
  nutrient: { name: string };
};

type RawDailyPlan = {
  daily_plan_id: number;
  daily_menus: Array<{
    meal: {
      meal_id: number;
      meal_type: MealType;
      is_finished: boolean;
      meal_menus: Array<{
        quantity: number;
        dish: {
          dish_id: number;
          dish_name: string;
          image_url: string | null;
          dish_nutrients: RawDishNutrient[];
        };
      }>;
    };
  }>;
};

type RawListDailyPlan = {
  daily_menus: Array<{
    meal: {
      meal_type: MealType;
      meal_menus: Array<{ dish_id: number }>;
    };
  }>;
};

type RawSuggestPlanWithDays = {
  suggest_plan_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  day_count: number;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
  suggest_plan_days: Array<{
    day_index: number;
    daily_plan_id: number;
    daily_plan: RawDailyPlan;
  }>;
};


function isDayCompleteFromMeals(meals: MealItemDTO[]): boolean {
  return REQUIRED_MEAL_TYPES.every((type) => {
    const meal = meals.find((m) => m.type === type);
    return !!meal && meal.dishes.length > 0;
  });
}

function isDayCompleteFromRaw(dailyPlan: RawListDailyPlan): boolean {
  const meals = dailyPlan.daily_menus.map((dm) => dm.meal);
  return REQUIRED_MEAL_TYPES.every((type) => {
    const meal = meals.find((m) => m.meal_type === type);
    return !!meal && meal.meal_menus.length > 0;
  });
}

function toDayMealsAndSummary(dailyPlan: RawDailyPlan): {
  meals: MealItemDTO[];
  summary: DailyPlanSummaryDTO;
} {
  return buildMealsAndSummary(dailyPlan.daily_menus);
}

function toSuggestPlanDay(
  dayIndex: number,
  dailyPlanId: number,
  dailyPlan: RawDailyPlan,
): SuggestPlanDayDTO {
  const mapped = toDayMealsAndSummary(dailyPlan);
  return {
    dayIndex,
    dailyPlanId,
    isComplete: isDayCompleteFromMeals(mapped.meals),
    summary: mapped.summary,
    meals: mapped.meals,
  };
}

function toSuggestPlanDetail(plan: RawSuggestPlanWithDays): SuggestPlanDetailDTO {
  const days = plan.suggest_plan_days.map((spd) =>
    toSuggestPlanDay(spd.day_index, spd.daily_plan_id, spd.daily_plan),
  );
  const completeDayCount = days.filter((d) => d.isComplete).length;
  const canPublish = plan.day_count > 0 && completeDayCount === plan.day_count;

  return {
    suggestPlanId: plan.suggest_plan_id,
    name: plan.name,
    description: plan.description,
    imageUrl: plan.image_url,
    dayCount: plan.day_count,
    completeDayCount,
    isPublic: plan.is_public,
    canPublish,
    days,
    createdAt: plan.created_at.toISOString(),
    updatedAt: plan.updated_at.toISOString(),
  };
}

function toSuggestPlanListItem(plan: {
  suggest_plan_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  day_count: number;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
  suggest_plan_days: Array<{ daily_plan: RawListDailyPlan }>;
}): SuggestPlanListItemDTO {
  const completeDayCount = plan.suggest_plan_days.filter((spd) =>
    isDayCompleteFromRaw(spd.daily_plan),
  ).length;

  return {
    suggestPlanId: plan.suggest_plan_id,
    name: plan.name,
    description: plan.description,
    imageUrl: plan.image_url,
    dayCount: plan.day_count,
    completeDayCount,
    isPublic: plan.is_public,
    createdAt: plan.created_at.toISOString(),
    updatedAt: plan.updated_at.toISOString(),
  };
}

function toPublicSuggestPlanListItem(plan: {
  suggest_plan_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  day_count: number;
}): SuggestPlanPublicListItemDTO {
  return {
    suggestPlanId: plan.suggest_plan_id,
    name: plan.name,
    description: plan.description,
    imageUrl: plan.image_url,
    dayCount: plan.day_count,
  };
}

function toPublicSuggestPlanDetail(plan: RawSuggestPlanWithDays): SuggestPlanPublicDetailDTO {
  const days: SuggestPlanPublicDayDTO[] = plan.suggest_plan_days.map((spd) => {
    const mapped = toSuggestPlanDay(spd.day_index, spd.daily_plan_id, spd.daily_plan);
    return {
      dayIndex: mapped.dayIndex,
      isComplete: mapped.isComplete,
      summary: mapped.summary,
      meals: mapped.meals,
    };
  });

  return {
    suggestPlanId: plan.suggest_plan_id,
    name: plan.name,
    description: plan.description,
    imageUrl: plan.image_url,
    dayCount: plan.day_count,
    days,
  };
}

function toMealNutrients(
  meal: NonNullable<Awaited<ReturnType<typeof dailyPlanRepository.findMealWithNutrients>>>,
  catalog: Awaited<ReturnType<typeof dailyPlanRepository.findAllNutrients>>,
): MealNutrientsDTO {
  const dishes = meal.meal_menus.map((mm) => {
    const valueMap = new Map(
      mm.dish.dish_nutrients.map((dn) => [dn.nutrient_id, dn.value]),
    );
    const nutrients: NutrientValueDTO[] = catalog.map((n) => ({
      nutrientId: n.nutrient_id,
      name: n.name,
      unit: n.unit,
      isMacro: n.is_macro,
      value: round2((valueMap.get(n.nutrient_id) ?? 0) * mm.quantity),
    }));
    return {
      dishId: mm.dish.dish_id,
      name: mm.dish.dish_name,
      quantity: mm.quantity,
      grams: Math.round(mm.quantity * 100),
      nutrients,
    };
  });

  const totals: NutrientValueDTO[] = catalog.map((n, idx) => ({
    nutrientId: n.nutrient_id,
    name: n.name,
    unit: n.unit,
    isMacro: n.is_macro,
    value: round2(dishes.reduce((sum, d) => sum + d.nutrients[idx].value, 0)),
  }));

  return {
    mealId: meal.meal_id,
    type: meal.meal_type,
    totals,
    dishes,
  };
}

export const suggestPlanService = {
  async list(
    search: string,
    page: number,
    pageSize: number,
    sort: SuggestPlanListSort = "created_desc",
  ): Promise<SuggestPlanListResponseDTO> {
    const skip = (page - 1) * pageSize;
    const [rows, total] = await Promise.all([
      suggestPlanRepository.listForAdmin(search, skip, pageSize, sort),
      suggestPlanRepository.countForAdmin(search),
    ]);

    return {
      items: rows.map(toSuggestPlanListItem),
      total,
      page,
      pageSize,
    };
  },

  async listPublic(
    search: string,
    page: number,
    pageSize: number,
    sort: "created_desc" | "created_asc" = "created_desc",
  ): Promise<SuggestPlanPublicListResponseDTO> {
    const skip = (page - 1) * pageSize;
    const [rows, total] = await Promise.all([
      suggestPlanRepository.listPublic(search, skip, pageSize, sort),
      suggestPlanRepository.countPublic(search),
    ]);

    return {
      items: rows.map(toPublicSuggestPlanListItem),
      total,
      page,
      pageSize,
    };
  },

  async getPublicDetail(
    suggestPlanId: number,
  ): Promise<
    | { ok: true; plan: SuggestPlanPublicDetailDTO }
    | { ok: false; reason: "not_found" }
  > {
    const plan = await suggestPlanRepository.findPublicByIdWithDays(suggestPlanId);
    if (!plan) return { ok: false, reason: "not_found" };

    return {
      ok: true,
      plan: toPublicSuggestPlanDetail(plan as RawSuggestPlanWithDays),
    };
  },

  async getPublicMealNutrients(
    mealId: number,
  ): Promise<MealNutrientsDTO | null> {
    const allowed =
      await suggestPlanRepository.isMealInPublicSuggestPlan(mealId);
    if (!allowed) return null;

    const meal = await dailyPlanRepository.findMealWithNutrients(mealId);
    if (!meal) return null;

    const catalog = await dailyPlanRepository.findAllNutrients();
    return toMealNutrients(meal, catalog);
  },

  async getDayNutrients(
    suggestPlanId: number,
    adminUserId: number,
    dayIndex: number,
  ): Promise<
    | { ok: true; data: SuggestPlanDayNutrientsDTO }
    | { ok: false; reason: "not_found" | "invalid_day" }
  > {
    const owned = await suggestPlanRepository.findOwnedByAdmin(
      suggestPlanId,
      adminUserId,
    );
    if (!owned) return { ok: false, reason: "not_found" };

    const link = await suggestPlanRepository.findDailyPlanLink(
      suggestPlanId,
      dayIndex,
    );
    if (!link) return { ok: false, reason: "invalid_day" };

    const planWithMeals = await dailyPlanRepository.findByIdWithMeals(
      link.daily_plan_id,
    );
    if (!planWithMeals) return { ok: false, reason: "invalid_day" };

    const catalog = await dailyPlanRepository.findAllNutrients();
    const mealTotalsList: NutrientValueDTO[][] = [];

    for (const dm of planWithMeals.daily_menus) {
      const meal = await dailyPlanRepository.findMealWithNutrients(
        dm.meal.meal_id,
      );
      if (meal) {
        mealTotalsList.push(toMealNutrients(meal, catalog).totals);
      }
    }

    const totals: NutrientValueDTO[] = catalog.map((n, idx) => ({
      nutrientId: n.nutrient_id,
      name: n.name,
      unit: n.unit,
      isMacro: n.is_macro,
      value: round2(
        mealTotalsList.reduce(
          (sum, mealTotals) => sum + (mealTotals[idx]?.value ?? 0),
          0,
        ),
      ),
    }));

    return {
      ok: true,
      data: {
        dayIndex,
        dailyPlanId: link.daily_plan_id,
        totals,
      },
    };
  },

  async create(
    adminUserId: number,
    name?: string,
    dayCount?: number,
  ): Promise<CreateSuggestPlanResponseDTO> {
    const suggestPlanId = await suggestPlanRepository.createWithEmptyDays(
      adminUserId,
      name,
      dayCount ?? 1,
    );
    return { suggestPlanId };
  },

  async getDetail(
    suggestPlanId: number,
    adminUserId: number,
  ): Promise<
    | { ok: true; plan: SuggestPlanDetailDTO }
    | { ok: false; reason: "not_found" }
  > {
    const owned = await suggestPlanRepository.findOwnedByAdmin(
      suggestPlanId,
      adminUserId,
    );
    if (!owned) return { ok: false, reason: "not_found" };

    const plan = await suggestPlanRepository.findByIdWithDays(suggestPlanId);
    if (!plan) return { ok: false, reason: "not_found" };

    return { ok: true, plan: toSuggestPlanDetail(plan as RawSuggestPlanWithDays) };
  },

  async updateMetadata(
    suggestPlanId: number,
    adminUserId: number,
    body: UpdateSuggestPlanBodyDTO,
  ): Promise<
    | { ok: true; plan: SuggestPlanDetailDTO; oldImageUrl: string | null }
    | { ok: false; reason: "not_found" }
  > {
    const owned = await suggestPlanRepository.findOwnedByAdmin(
      suggestPlanId,
      adminUserId,
    );
    if (!owned) return { ok: false, reason: "not_found" };

    await suggestPlanRepository.updateMetadata(suggestPlanId, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined
        ? { description: body.description }
        : {}),
      ...(body.imageUrl !== undefined ? { image_url: body.imageUrl } : {}),
    });

    const plan = await suggestPlanRepository.findByIdWithDays(suggestPlanId);
    if (!plan) return { ok: false, reason: "not_found" };

    return { ok: true, plan: toSuggestPlanDetail(plan as RawSuggestPlanWithDays), oldImageUrl: owned.image_url,};  
  },

  async remove(
    suggestPlanId: number,
    adminUserId: number,
  ): Promise<{ ok: true } | { ok: false; reason: "not_found" }> {
    const owned = await suggestPlanRepository.findOwnedByAdmin(
      suggestPlanId,
      adminUserId,
    );
    if (!owned) return { ok: false, reason: "not_found" };

    await suggestPlanRepository.deleteById(suggestPlanId);
    return { ok: true };
  },

  async publish(
    suggestPlanId: number,
    adminUserId: number,
    isPublic: boolean,
  ): Promise<
    | { ok: true; result: PublishSuggestPlanResponseDTO }
    | { ok: false; reason: "not_found" | "incomplete" }
  > {
    const owned = await suggestPlanRepository.findOwnedByAdmin(
      suggestPlanId,
      adminUserId,
    );
    if (!owned) return { ok: false, reason: "not_found" };

    const plan = await suggestPlanRepository.findByIdWithDays(suggestPlanId);
    if (!plan) return { ok: false, reason: "not_found" };

    const detail = toSuggestPlanDetail(plan as RawSuggestPlanWithDays);
    if (isPublic && !detail.canPublish) {
      return { ok: false, reason: "incomplete" };
    }

    await suggestPlanRepository.setPublic(suggestPlanId, isPublic);

    return {
      ok: true,
      result: {
        suggestPlanId,
        isPublic,
        canPublish: detail.canPublish,
      },
    };
  },

  async addDay(
    suggestPlanId: number,
    adminUserId: number,
  ): Promise<
    | { ok: true; result: AddSuggestPlanDayResponseDTO }
    | { ok: false; reason: "not_found" | "max_days" }
  > {
    const owned = await suggestPlanRepository.findOwnedByAdmin(
      suggestPlanId,
      adminUserId,
    );
    if (!owned) return { ok: false, reason: "not_found" };

    const added = await suggestPlanRepository.addEmptyDay(
      suggestPlanId,
      adminUserId,
    );
    if (!added) return { ok: false, reason: "max_days" };

    const plan = await suggestPlanRepository.findByIdWithDays(suggestPlanId);
    if (!plan) return { ok: false, reason: "not_found" };

    const dayRow = plan.suggest_plan_days.find(
      (d) => d.day_index === added.dayIndex,
    );
    if (!dayRow) return { ok: false, reason: "not_found" };

    const day = toSuggestPlanDay(
      dayRow.day_index,
      dayRow.daily_plan_id,
      dayRow.daily_plan as RawDailyPlan,
    );

    return {
      ok: true,
      result: {
        dayIndex: added.dayIndex,
        dailyPlanId: added.dailyPlanId,
        dayCount: added.dayCount,
        day,
      },
    };
  },

  async removeDay(
    suggestPlanId: number,
    adminUserId: number,
    dayIndex: number,
  ): Promise<
    | { ok: true; result: RemoveSuggestPlanDayResponseDTO }
    | { ok: false; reason: "not_found" | "min_days" | "invalid_day" }
  > {
    const owned = await suggestPlanRepository.findOwnedByAdmin(
      suggestPlanId,
      adminUserId,
    );
    if (!owned) return { ok: false, reason: "not_found" };

    const removed = await suggestPlanRepository.removeDayAtIndex(
      suggestPlanId,
      dayIndex,
    );

    if (!removed.ok) {
      if (removed.reason === "min_days") {
        return { ok: false, reason: "min_days" };
      }
      if (removed.reason === "invalid_day") {
        return { ok: false, reason: "invalid_day" };
      }
      return { ok: false, reason: "not_found" };
    }

    await suggestPlanService.revalidatePublicStatus(suggestPlanId);

    const plan = await suggestPlanRepository.findByIdWithDays(suggestPlanId);
    if (!plan) return { ok: false, reason: "not_found" };

    return {
      ok: true,
      result: {
        dayCount: removed.dayCount,
        deletedDayIndex: removed.deletedDayIndex,
        plan: toSuggestPlanDetail(plan as RawSuggestPlanWithDays),
      },
    };
  },  async revalidatePublicStatus(suggestPlanId: number): Promise<void> {
    const plan = await suggestPlanRepository.findByIdWithDays(suggestPlanId);
    if (!plan || !plan.is_public) return;

    const detail = toSuggestPlanDetail(plan as RawSuggestPlanWithDays);
    if (!detail.canPublish) {
      await suggestPlanRepository.setPublic(suggestPlanId, false);
    }
  },
};