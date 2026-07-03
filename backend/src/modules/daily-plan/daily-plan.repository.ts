import { prisma } from "../../config/prisma";
import { MealType } from "../../../prisma/generated/prisma/client";
import { DAILY_PLAN_NUTRIENT_NAMES } from "../../constants/nutrient-names";

const MACRO_NUTRIENT_NAMES = [...DAILY_PLAN_NUTRIENT_NAMES];
export const dailyPlanRepository = {
  findByUserAndDate(userId: number, date: Date) {
    return prisma.dailyPlan.findFirst({
      where: {
        user_id: userId,
        daily_plan_date: date,
      },
      include: {
        daily_menus: {
          include: {
            meal: {
              include: {
                meal_menus: {
                  include: {
                    dish: {
                      include: {
                        dish_nutrients: {
                          select: {
                            value: true,
                            nutrient_id: true,
                            nutrient: { select: { name: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  },
  findMealOwner(mealId: number) {
    return prisma.dailyMenu.findFirst({
      where: { meal_id: mealId },
      include: { daily_plan: { select: { user_id: true } } },
    });
  },

  setMealFinished(mealId: number, isFinished: boolean) {
    return prisma.meal.update({
      where: { meal_id: mealId },
      data: { is_finished: isFinished },
    });
  },

  findMealWithNutrients(mealId: number) {
    return prisma.meal.findUnique({
      where: { meal_id: mealId },
      include: {
        daily_menus: {
          include: { daily_plan: { select: { user_id: true } } },
        },
        meal_menus: {
          include: {
            dish: {
              select: {
                dish_id: true,
                dish_name: true,
                dish_nutrients: {
                  select: { nutrient_id: true, value: true },
                },
              },
            },
          },
        },
      },
    });
  },

  findAllNutrients() {
    return prisma.nutrient.findMany({
      select: {
        nutrient_id: true,
        name: true,
        unit: true,
        is_macro: true,
      },
      orderBy: { nutrient_id: "asc" },
    });
  },

  findMealContext(mealId: number) {
    return prisma.dailyMenu.findFirst({
      where: { meal_id: mealId },
      select: {
        daily_plan_id: true,
        daily_plan: {
          select: { user_id: true, daily_plan_date: true, is_template: true },
        },
      },
    });
  },

  findAccessibleDish(dishId: number, userId: number) {
    return prisma.dish.findFirst({
      where: {
        dish_id: dishId,
        OR: [{ is_global: true }, { created_by: userId }],
      },
      select: { dish_id: true },
    });
  },

  findMealMenu(mealId: number, dishId: number) {
    return prisma.mealMenu.findUnique({
      where: { meal_id_dish_id: { meal_id: mealId, dish_id: dishId } },
      select: { meal_id: true },
    });
  },

  findPlanWithMealTypes(userId: number, date: Date) {
    return prisma.dailyPlan.findFirst({
      where: { user_id: userId, daily_plan_date: date },
      select: {
        daily_plan_id: true,
        daily_menus: { select: { meal: { select: { meal_type: true } } } },
      },
    });
  },

  addMealMenu(mealId: number, dishId: number, quantity: number) {
    return prisma.mealMenu.create({
      data: { meal_id: mealId, dish_id: dishId, quantity },
    });
  },

  updateMealMenuQuantity(mealId: number, dishId: number, quantity: number) {
    return prisma.mealMenu.update({
      where: { meal_id_dish_id: { meal_id: mealId, dish_id: dishId } },
      data: { quantity },
    });
  },

  removeMealDishWithCleanup(planId: number, mealId: number, dishId: number) {
    return prisma.$transaction(async (tx) => {
      await tx.mealMenu.delete({
        where: { meal_id_dish_id: { meal_id: mealId, dish_id: dishId } },
      });

      const remainingDishes = await tx.mealMenu.count({
        where: { meal_id: mealId },
      });
      if (remainingDishes === 0) {
        await tx.meal.delete({ where: { meal_id: mealId } });

        const remainingMeals = await tx.dailyMenu.count({
          where: { daily_plan_id: planId },
        });
        if (remainingMeals === 0) {
          const plan = await tx.dailyPlan.findUnique({
            where: { daily_plan_id: planId },
            select: { is_template: true },
          });
          if (!plan?.is_template) {
            await tx.dailyPlan.delete({ where: { daily_plan_id: planId } });
          }
        }
      }
    });
  },

  createMealWithFirstDish(
    userId: number,
    date: Date,
    mealType: MealType,
    dishId: number,
    quantity: number,
    existingPlanId?: number,
  ): Promise<number> {
    return prisma.$transaction(async (tx) => {
      let planId = existingPlanId;
      if (!planId) {
        const created = await tx.dailyPlan.create({
          data: { user_id: userId, daily_plan_date: date },
          select: { daily_plan_id: true },
        });
        planId = created.daily_plan_id;
      }
      const meal = await tx.meal.create({
        data: { meal_type: mealType },
        select: { meal_id: true },
      });
      await tx.dailyMenu.create({
        data: { daily_plan_id: planId, meal_id: meal.meal_id },
      });
      await tx.mealMenu.create({
        data: { meal_id: meal.meal_id, dish_id: dishId, quantity },
      });
      return meal.meal_id;
    });
  },

  findByIdWithMeals(dailyPlanId: number) {
    return prisma.dailyPlan.findUnique({
      where: { daily_plan_id: dailyPlanId },
      include: {
        daily_menus: {
          include: {
            meal: {
              include: {
                meal_menus: {
                  include: {
                    dish: {
                      include: {
                        dish_nutrients: {
                          where: {
                            nutrient: { name: { in: MACRO_NUTRIENT_NAMES } },
                          },
                          select: {
                            value: true,
                            nutrient: { select: { name: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  findTemplatePlanWithMealTypes(dailyPlanId: number, userId: number) {
    return prisma.dailyPlan.findFirst({
      where: {
        daily_plan_id: dailyPlanId,
        user_id: userId,
        is_template: true,
      },
      select: {
        daily_plan_id: true,
        daily_plan_date: true,
        daily_menus: { select: { meal: { select: { meal_type: true } } } },
      },
    });
  },

  findSuggestPlanIdByDailyPlanId(dailyPlanId: number) {
    return prisma.suggestPlanDay.findFirst({
      where: { daily_plan_id: dailyPlanId },
      select: { suggest_plan_id: true },
    });
  },

  async clearUserDay(userId: number, date: Date) {
    const plan = await prisma.dailyPlan.findFirst({
      where: {
        user_id: userId,
        daily_plan_date: date,
        is_template: false,
      },
      include: { daily_menus: { select: { meal_id: true } } },
    });
    if (!plan) return;

    await prisma.$transaction(async (tx) => {
      for (const dm of plan.daily_menus) {
        await tx.mealMenu.deleteMany({ where: { meal_id: dm.meal_id } });
        await tx.dailyMenu.deleteMany({ where: { meal_id: dm.meal_id } });
        await tx.meal.delete({ where: { meal_id: dm.meal_id } });
      }
      await tx.dailyPlan.delete({ where: { daily_plan_id: plan.daily_plan_id } });
    });
  },

  async findUserMealByTypeOnDate(
    userId: number,
    date: Date,
    mealType: MealType,
  ) {
    const row = await prisma.dailyMenu.findFirst({
      where: {
        daily_plan: {
          user_id: userId,
          daily_plan_date: date,
          is_template: false,
        },
        meal: { meal_type: mealType },
      },
      select: {
        meal_id: true,
        daily_plan_id: true,
      },
    });
    if (!row) return null;
    return { mealId: row.meal_id, dailyPlanId: row.daily_plan_id };
  },

  async deleteUserMeal(mealId: number) {
    await prisma.$transaction(async (tx) => {
      await tx.mealMenu.deleteMany({ where: { meal_id: mealId } });
      await tx.dailyMenu.deleteMany({ where: { meal_id: mealId } });
      await tx.meal.delete({ where: { meal_id: mealId } });
    });
  },

  async deleteUserMealsByTypeOnDate(
    userId: number,
    date: Date,
    mealType: MealType,
  ) {
    const plan = await prisma.dailyPlan.findFirst({
      where: {
        user_id: userId,
        daily_plan_date: date,
        is_template: false,
      },
      include: {
        daily_menus: {
          where: { meal: { meal_type: mealType } },
          select: { meal_id: true },
        },
      },
    });
    if (!plan) return;

    await prisma.$transaction(async (tx) => {
      for (const dm of plan.daily_menus) {
        await tx.mealMenu.deleteMany({ where: { meal_id: dm.meal_id } });
        await tx.dailyMenu.deleteMany({ where: { meal_id: dm.meal_id } });
        await tx.meal.delete({ where: { meal_id: dm.meal_id } });
      }
      const remaining = await tx.dailyMenu.count({
        where: { daily_plan_id: plan.daily_plan_id },
      });
      if (remaining === 0) {
        await tx.dailyPlan.delete({
          where: { daily_plan_id: plan.daily_plan_id },
        });
      }
    });
  },

  async createMealWithDishes(
    userId: number,
    date: Date,
    mealType: MealType,
    dishes: { dishId: number; quantity: number }[],
    existingPlanId?: number,
  ): Promise<number> {
    return prisma.$transaction(async (tx) => {
      let planId = existingPlanId;
      if (!planId) {
        const existing = await tx.dailyPlan.findFirst({
          where: {
            user_id: userId,
            daily_plan_date: date,
            is_template: false,
          },
          select: { daily_plan_id: true },
        });
        planId = existing?.daily_plan_id;
      }
      if (!planId) {
        const created = await tx.dailyPlan.create({
          data: { user_id: userId, daily_plan_date: date },
          select: { daily_plan_id: true },
        });
        planId = created.daily_plan_id;
      }

      const meal = await tx.meal.create({
        data: { meal_type: mealType },
        select: { meal_id: true },
      });
      await tx.dailyMenu.create({
        data: { daily_plan_id: planId, meal_id: meal.meal_id },
      });

      for (const dish of dishes) {
        if (dish.quantity <= 0) continue;
        await tx.mealMenu.create({
          data: {
            meal_id: meal.meal_id,
            dish_id: dish.dishId,
            quantity: dish.quantity,
          },
        });
      }

      return meal.meal_id;
    });
  },
};
