import { dailyPlanRepository } from "./daily-plan.repository";
import { userRepository } from "../user/user.repository";
import { MealType } from "../../../prisma/generated/prisma/client";
import {
  DailyPlanResponseDTO,
  DishItemDTO,
  MealItemDTO,
  MealNutrientsDTO,
  NutrientTotalsDTO,
  NutrientValueDTO,
  TrackedNutrientDayDTO,
} from "./daily-plan.dto";
import { DEFAULT_DISH_IMAGE_URL } from "../../constants/default-images";
import { suggestPlanService } from "../suggest-plan/suggest-plan.service";
import { NUTRIENT_NAMES } from "../../constants/nutrient-names";

const MEAL_ORDER: Record<string, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
};

const DEFAULT_DISH_IMAGE = DEFAULT_DISH_IMAGE_URL;
const N_CAL = NUTRIENT_NAMES.CALORIES;
const N_PRO = NUTRIENT_NAMES.PROTEIN;
const N_CARB = NUTRIENT_NAMES.CARBOHYDRATE;
const N_FAT = NUTRIENT_NAMES.FAT;

function parseDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type MealContext = {
  daily_plan_id: number;
  daily_plan: {
    user_id: number;
    daily_plan_date: Date;
    is_template: boolean;
  };
};

async function revalidateSuggestPlanIfTemplate(dailyPlanId: number) {
  const link =
    await dailyPlanRepository.findSuggestPlanIdByDailyPlanId(dailyPlanId);
  if (link) {
    await suggestPlanService.revalidatePublicStatus(link.suggest_plan_id);
  }
}

function mapPlanRecordToResponse(
  plan: NonNullable<
    Awaited<ReturnType<typeof dailyPlanRepository.findByIdWithMeals>>
  >,
): DailyPlanResponseDTO {
  const dateStr = toDateStr(plan.daily_plan_date);

  const meals: MealItemDTO[] = plan.daily_menus
    .map((dm) => {
      const meal = dm.meal;

      let mCal = 0;
      let mPro = 0;
      let mCarb = 0;
      let mFat = 0;

      const dishes: DishItemDTO[] = meal.meal_menus.map((mm) => {
        const valueByName = new Map(
          mm.dish.dish_nutrients.map((dn) => [dn.nutrient.name, dn.value]),
        );
        const q = mm.quantity;
        const cal = (valueByName.get(N_CAL) ?? 0) * q;

        mCal += cal;
        mPro += (valueByName.get(N_PRO) ?? 0) * q;
        mCarb += (valueByName.get(N_CARB) ?? 0) * q;
        mFat += (valueByName.get(N_FAT) ?? 0) * q;

        return {
          dishId: mm.dish.dish_id,
          name: mm.dish.dish_name,
          imageUrl: mm.dish.image_url,
          quantity: q,
          grams: Math.round(q * 100),
          calories: Math.round(cal),
        };
      });

      return {
        mealId: meal.meal_id,
        type: meal.meal_type,
        isFinished: meal.is_finished,
        calories: round1(mCal),
        protein: round1(mPro),
        carb: round1(mCarb),
        fat: round1(mFat),
        coverImageUrl: pickCoverImage(dishes),
        dishes,
      };
    })
    .sort((a, b) => (MEAL_ORDER[a.type] ?? 99) - (MEAL_ORDER[b.type] ?? 99));

  const total = emptyTotals();
  const completed = emptyTotals();
  for (const meal of meals) {
    total.calories += meal.calories;
    total.protein += meal.protein;
    total.carb += meal.carb;
    total.fat += meal.fat;
    if (meal.isFinished) {
      completed.calories += meal.calories;
      completed.protein += meal.protein;
      completed.carb += meal.carb;
      completed.fat += meal.fat;
    }
  }

  return {
    date: dateStr,
    hasPlan: true,
    summary: {
      total: {
        calories: round1(total.calories),
        protein: round1(total.protein),
        carb: round1(total.carb),
        fat: round1(total.fat),
      },
      completed: {
        calories: round1(completed.calories),
        protein: round1(completed.protein),
        carb: round1(completed.carb),
        fat: round1(completed.fat),
      },
    },
    meals,
    trackedNutrients: [],
  };
}

async function reloadPlanAfterMealEdit(
  userId: number,
  ctx: MealContext,
): Promise<DailyPlanResponseDTO> {
  if (ctx.daily_plan.is_template) {
    const plan = await dailyPlanRepository.findByIdWithMeals(ctx.daily_plan_id);
    if (!plan) {
      return {
        date: toDateStr(ctx.daily_plan.daily_plan_date),
        hasPlan: false,
        summary: null,
        meals: [],
        trackedNutrients: [],
      };
    }
    return mapPlanRecordToResponse(plan);
  }

  return dailyPlanService.getDailyPlan(
    userId,
    toDateStr(ctx.daily_plan.daily_plan_date),
  );
}

type MealEditResult =
  | { ok: true; plan: DailyPlanResponseDTO }
  | {
      ok: false;
      reason:
        | "forbidden"
        | "dish_not_found"
        | "duplicate"
        | "not_in_meal"
        | "meal_type_exists";
    };
type CreateMealResult =
  | { ok: true; mealId: number; plan: DailyPlanResponseDTO }
  | {
      ok: false;
      reason: "dish_not_found" | "meal_type_exists" | "forbidden";
    };

function pickCoverImage(dishes: DishItemDTO[]): string {
  if (dishes.length === 0) return DEFAULT_DISH_IMAGE;
  const nonDefault = dishes.filter(
    (d) => d.imageUrl && !d.imageUrl.includes("default_dish"),
  );
  const pool = nonDefault.length > 0 ? nonDefault : dishes;
  const cover = pool.reduce(
    (best, d) => (d.calories > best.calories ? d : best),
    pool[0],
  );
  return cover.imageUrl ?? DEFAULT_DISH_IMAGE;
}

function emptyTotals(): NutrientTotalsDTO {
  return { calories: 0, protein: 0, carb: 0, fat: 0 };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

type RawDayPlan = NonNullable<
  Awaited<ReturnType<typeof dailyPlanRepository.findByUserAndDate>>
>;

type TrackedRow = Awaited<
  ReturnType<typeof userRepository.findTrackedNutrients>
>[number];

function buildTrackedNutrientsFromPlan(
  plan: RawDayPlan | null,
  trackedRows: TrackedRow[],
): TrackedNutrientDayDTO[] {
  return trackedRows.map((row) => {
    let completed = 0;
    if (plan) {
      for (const dm of plan.daily_menus) {
        if (!dm.meal.is_finished) continue;
        for (const mm of dm.meal.meal_menus) {
          for (const dn of mm.dish.dish_nutrients) {
            if (dn.nutrient_id === row.nutrient_id) {
              completed += dn.value * mm.quantity;
            }
          }
        }
      }
    }
    return {
      sortOrder: row.sort_order,
      nutrientId: row.nutrient.nutrient_id,
      name: row.nutrient.name,
      unit: row.nutrient.unit,
      completed: round2(completed),
    };
  });
}

export const dailyPlanService = {
  async getDailyPlan(
    userId: number,
    dateStr: string,
  ): Promise<DailyPlanResponseDTO> {
    const date = parseDateOnly(dateStr);
    const [plan, trackedRows] = await Promise.all([
      dailyPlanRepository.findByUserAndDate(userId, date),
      userRepository.findTrackedNutrients(userId),
    ]);

    const trackedNutrients = buildTrackedNutrientsFromPlan(plan, trackedRows);

    if (!plan) {
      return {
        date: dateStr,
        hasPlan: false,
        summary: null,
        meals: [],
        trackedNutrients,
      };
    }

    const meals: MealItemDTO[] = plan.daily_menus
      .map((dm) => {
        const meal = dm.meal;

        let mCal = 0;
        let mPro = 0;
        let mCarb = 0;
        let mFat = 0;

        const dishes: DishItemDTO[] = meal.meal_menus.map((mm) => {
          const valueByName = new Map(
            mm.dish.dish_nutrients.map((dn) => [dn.nutrient.name, dn.value]),
          );
          const q = mm.quantity;
          const cal = (valueByName.get(N_CAL) ?? 0) * q;

          mCal += cal;
          mPro += (valueByName.get(N_PRO) ?? 0) * q;
          mCarb += (valueByName.get(N_CARB) ?? 0) * q;
          mFat += (valueByName.get(N_FAT) ?? 0) * q;

          return {
            dishId: mm.dish.dish_id,
            name: mm.dish.dish_name,
            imageUrl: mm.dish.image_url,
            quantity: q,
            grams: Math.round(q * 100),
            calories: Math.round(cal),
          };
        });

        return {
          mealId: meal.meal_id,
          type: meal.meal_type,
          isFinished: meal.is_finished,
          calories: round1(mCal),
          protein: round1(mPro),
          carb: round1(mCarb),
          fat: round1(mFat),
          coverImageUrl: pickCoverImage(dishes),
          dishes,
        };
      })
      .sort((a, b) => (MEAL_ORDER[a.type] ?? 99) - (MEAL_ORDER[b.type] ?? 99));

    const total = emptyTotals();
    const completed = emptyTotals();
    for (const meal of meals) {
      total.calories += meal.calories;
      total.protein += meal.protein;
      total.carb += meal.carb;
      total.fat += meal.fat;
      if (meal.isFinished) {
        completed.calories += meal.calories;
        completed.protein += meal.protein;
        completed.carb += meal.carb;
        completed.fat += meal.fat;
      }
    }

    return {
      date: dateStr,
      hasPlan: true,
      summary: {
        total: {
          calories: round1(total.calories),
          protein: round1(total.protein),
          carb: round1(total.carb),
          fat: round1(total.fat),
        },
        completed: {
          calories: round1(completed.calories),
          protein: round1(completed.protein),
          carb: round1(completed.carb),
          fat: round1(completed.fat),
        },
      },
      meals,
      trackedNutrients,
    };
  },

  async setMealFinished(userId: number, mealId: number, isFinished: boolean) {
    const owner = await dailyPlanRepository.findMealOwner(mealId);
    if (!owner || owner.daily_plan.user_id !== userId) {
      return null;
    }
    await dailyPlanRepository.setMealFinished(mealId, isFinished);
    return { mealId, isFinished };
  },

  async getMealNutrients(
    userId: number,
    mealId: number,
  ): Promise<MealNutrientsDTO | null> {
    const meal = await dailyPlanRepository.findMealWithNutrients(mealId);
    if (!meal) return null;

    const ownerId = meal.daily_menus[0]?.daily_plan?.user_id;
    if (ownerId !== userId) return null;

    const catalog = await dailyPlanRepository.findAllNutrients();

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
  },

  async addDishToMeal(
    userId: number,
    mealId: number,
    dishId: number,
    grams: number,
  ): Promise<MealEditResult> {
    const ctx = await dailyPlanRepository.findMealContext(mealId);
    if (!ctx || ctx.daily_plan.user_id !== userId) {
      return { ok: false, reason: "forbidden" };
    }
    const dish = await dailyPlanRepository.findAccessibleDish(dishId, userId);
    if (!dish) return { ok: false, reason: "dish_not_found" };
    const existing = await dailyPlanRepository.findMealMenu(mealId, dishId);
    if (existing) return { ok: false, reason: "duplicate" };

    await dailyPlanRepository.addMealMenu(mealId, dishId, grams / 100);

    if (ctx.daily_plan.is_template) {
      await revalidateSuggestPlanIfTemplate(ctx.daily_plan_id);
    }

    const plan = await reloadPlanAfterMealEdit(userId, ctx);
    return { ok: true, plan };
  },

  async updateMealDishGrams(
    userId: number,
    mealId: number,
    dishId: number,
    grams: number,
  ): Promise<MealEditResult> {
    const ctx = await dailyPlanRepository.findMealContext(mealId);
    if (!ctx || ctx.daily_plan.user_id !== userId) {
      return { ok: false, reason: "forbidden" };
    }
    const existing = await dailyPlanRepository.findMealMenu(mealId, dishId);
    if (!existing) return { ok: false, reason: "not_in_meal" };

    await dailyPlanRepository.updateMealMenuQuantity(
      mealId,
      dishId,
      grams / 100,
    );

    if (ctx.daily_plan.is_template) {
      await revalidateSuggestPlanIfTemplate(ctx.daily_plan_id);
    }

    const plan = await reloadPlanAfterMealEdit(userId, ctx);
    return { ok: true, plan };
  },

  async removeMealDish(
    userId: number,
    mealId: number,
    dishId: number,
  ): Promise<MealEditResult> {
    const ctx = await dailyPlanRepository.findMealContext(mealId);
    if (!ctx || ctx.daily_plan.user_id !== userId) {
      return { ok: false, reason: "forbidden" };
    }
    const existing = await dailyPlanRepository.findMealMenu(mealId, dishId);
    if (!existing) return { ok: false, reason: "not_in_meal" };

    await dailyPlanRepository.removeMealDishWithCleanup(
      ctx.daily_plan_id,
      mealId,
      dishId,
    );

    if (ctx.daily_plan.is_template) {
      await revalidateSuggestPlanIfTemplate(ctx.daily_plan_id);
    }

    const plan = await reloadPlanAfterMealEdit(userId, ctx);
    return { ok: true, plan };
  },

  async createMeal(
    userId: number,
    input: {
      date?: string;
      dailyPlanId?: number;
      mealType: MealType;
      dishId: number;
      grams: number;
    },
  ): Promise<CreateMealResult> {
    const dish = await dailyPlanRepository.findAccessibleDish(
      input.dishId,
      userId,
    );
    if (!dish) return { ok: false, reason: "dish_not_found" };

    if (input.dailyPlanId !== undefined) {
      const plan = await dailyPlanRepository.findTemplatePlanWithMealTypes(
        input.dailyPlanId,
        userId,
      );
      if (!plan) return { ok: false, reason: "forbidden" };

      if (input.mealType !== "snack") {
        const dup = plan.daily_menus.some(
          (dm) => dm.meal.meal_type === input.mealType,
        );
        if (dup) return { ok: false, reason: "meal_type_exists" };
      }

      const mealId = await dailyPlanRepository.createMealWithFirstDish(
        userId,
        plan.daily_plan_date,
        input.mealType,
        input.dishId,
        input.grams / 100,
        plan.daily_plan_id,
      );

      await revalidateSuggestPlanIfTemplate(plan.daily_plan_id);

      const loaded = await dailyPlanRepository.findByIdWithMeals(
        plan.daily_plan_id,
      );
      const result = loaded
        ? mapPlanRecordToResponse(loaded)
        : {
            date: toDateStr(plan.daily_plan_date),
            hasPlan: false,
            summary: null,
            meals: [],
            trackedNutrients: [],
          };

      return { ok: true, mealId, plan: result };
    }

    if (!input.date) {
      return { ok: false, reason: "forbidden" };
    }

    const date = parseDateOnly(input.date);
    const plan = await dailyPlanRepository.findPlanWithMealTypes(userId, date);

    if (plan && input.mealType !== "snack") {
      const dup = plan.daily_menus.some(
        (dm) => dm.meal.meal_type === input.mealType,
      );
      if (dup) return { ok: false, reason: "meal_type_exists" };
    }

    const mealId = await dailyPlanRepository.createMealWithFirstDish(
      userId,
      date,
      input.mealType,
      input.dishId,
      input.grams / 100,
      plan?.daily_plan_id,
    );

    const result = await dailyPlanService.getDailyPlan(userId, input.date);
    return { ok: true, mealId, plan: result };
  },
};