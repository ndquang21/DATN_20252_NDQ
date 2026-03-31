import { prisma } from "../../config/prisma";
import { Prisma } from "../../../prisma/generated/prisma/client";
import {
  LOCKED_MACRO_NAMES,
  NUTRIENT_NAMES,
} from "../../constants/nutrient-names";

const MACRO_NAMES = [...LOCKED_MACRO_NAMES];

const mineDishSelect = {
  dish_id: true,
  dish_name: true,
  image_url: true,
  dish_nutrients: {
    where: {
      nutrient: {
        name: { in: MACRO_NAMES },
      },
    },
    select: {
      value: true,
      nutrient: { select: { name: true } },
    },
  },
} satisfies Prisma.DishSelect;

const dishDetailSelect = {
  dish_id: true,
  dish_name: true,
  image_url: true,
  dish_nutrients: {
    select: {
      value: true,
      nutrient: {
        select: {
          nutrient_id: true,
          name: true,
          unit: true,
        },
      },
    },
    orderBy: { nutrient_id: "asc" as const },
  },
} satisfies Prisma.DishSelect;

function buildGlobalWhere(search: string): Prisma.DishWhereInput {
  const where: Prisma.DishWhereInput = { is_global: true };
  if (search) {
    where.dish_name = { contains: search, mode: "insensitive" };
  }
  return where;
}

async function cleanupMealsAfterDishDelete(
  tx: Prisma.TransactionClient,
  dishId: number,
) {
  const mealMenus = await tx.mealMenu.findMany({
    where: { dish_id: dishId },
    select: {
      meal_id: true,
      meal: {
        select: {
          daily_menus: { select: { daily_plan_id: true } },
        },
      },
    },
  });

  const affectedMealIds = [...new Set(mealMenus.map((m) => m.meal_id))];

  await tx.dish.delete({ where: { dish_id: dishId } });

  for (const mealId of affectedMealIds) {
    const remaining = await tx.mealMenu.count({ where: { meal_id: mealId } });
    if (remaining > 0) continue;

    const dailyMenu = await tx.dailyMenu.findFirst({
      where: { meal_id: mealId },
      select: { daily_plan_id: true },
    });

    await tx.meal.delete({ where: { meal_id: mealId } });

    if (dailyMenu) {
      const remainingMeals = await tx.dailyMenu.count({
        where: { daily_plan_id: dailyMenu.daily_plan_id },
      });
      if (remainingMeals === 0) {
        await tx.dailyPlan.delete({
          where: { daily_plan_id: dailyMenu.daily_plan_id },
        });
      }
    }
  }
}

function buildWhere(userId: number, search: string): Prisma.DishWhereInput {
  const where: Prisma.DishWhereInput = {
    OR: [{ is_global: true }, { created_by: userId }],
  };
  if (search) {
    where.dish_name = { contains: search, mode: "insensitive" };
  }
  return where;
}

function pickMacroValue(
  rows: { value: number; nutrient: { name: string } }[],
  name: string,
): number {
  return rows.find((r) => r.nutrient.name === name)?.value ?? 0;
}

export const dishRepository = {
  search(userId: number, search: string, skip: number, take: number) {
    return prisma.dish.findMany({
      where: buildWhere(userId, search),
      select: {
        dish_id: true,
        dish_name: true,
        image_url: true,
        dish_nutrients: {
          where: { nutrient: { name: NUTRIENT_NAMES.CALORIES } },
          select: { value: true },
        },
      },
      orderBy: { dish_name: "asc" },
      skip,
      take,
    });
  },

  count(userId: number, search: string) {
    return prisma.dish.count({ where: buildWhere(userId, search) });
  },

  findMine(userId: number, skip: number, take: number) {
    return prisma.dish.findMany({
      where: { created_by: userId, is_global: false },
      select: mineDishSelect,
      orderBy: { created_at: "desc" },
      skip,
      take,
    });
  },

  countMine(userId: number) {
    return prisma.dish.count({
      where: { created_by: userId, is_global: false },
    });
  },

  createWithNutrients(input: {
    userId: number;
    name: string;
    imageUrl: string;
    nutrients: { nutrientId: number; value: number }[];
  }) {
    return prisma.$transaction(async (tx) => {
      const dish = await tx.dish.create({
        data: {
          dish_name: input.name,
          created_by: input.userId,
          is_global: false,
          image_url: input.imageUrl,
        },
      });

      await tx.dishNutrient.createMany({
        data: input.nutrients.map((n) => ({
          dish_id: dish.dish_id,
          nutrient_id: n.nutrientId,
          value: n.value,
        })),
      });

      return tx.dish.findUniqueOrThrow({
        where: { dish_id: dish.dish_id },
        select: mineDishSelect,
      });
    });
  },

  findMineById(userId: number, dishId: number) {
    return prisma.dish.findFirst({
      where: { dish_id: dishId, created_by: userId, is_global: false },
      select: dishDetailSelect,
    });
  },

  updateWithNutrients(input: {
    dishId: number;
    userId: number;
    name: string;
    imageUrl?: string;
    nutrients: { nutrientId: number; value: number }[];
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.dish.findFirst({
        where: {
          dish_id: input.dishId,
          created_by: input.userId,
          is_global: false,
        },
      });
      if (!existing) return null;

      await tx.dish.update({
        where: { dish_id: input.dishId },
        data: {
          dish_name: input.name,
          ...(input.imageUrl !== undefined
            ? { image_url: input.imageUrl }
            : {}),
        },
      });

      await tx.dishNutrient.deleteMany({
        where: { dish_id: input.dishId },
      });
      await tx.dishNutrient.createMany({
        data: input.nutrients.map((n) => ({
          dish_id: input.dishId,
          nutrient_id: n.nutrientId,
          value: n.value,
        })),
      });

      return tx.dish.findUniqueOrThrow({
        where: { dish_id: input.dishId },
        select: mineDishSelect,
      });
    });
  },

  deleteOwnedWithCleanup(userId: number, dishId: number) {
    return prisma.$transaction(async (tx) => {
      const dish = await tx.dish.findFirst({
        where: { dish_id: dishId, created_by: userId, is_global: false },
      });
      if (!dish) return null;

      await cleanupMealsAfterDishDelete(tx, dishId);

      return dish;
    });
  },

  listGlobal(search: string, skip: number, take: number) {
    return prisma.dish.findMany({
      where: buildGlobalWhere(search),
      select: mineDishSelect,
      orderBy: { dish_name: "asc" },
      skip,
      take,
    });
  },

  countGlobal(search: string) {
    return prisma.dish.count({ where: buildGlobalWhere(search) });
  },

  findGlobalById(dishId: number) {
    return prisma.dish.findFirst({
      where: { dish_id: dishId, is_global: true },
      select: dishDetailSelect,
    });
  },

  // Tìm món hệ thống bằng tên (unique, không phụ thuộc admin tạo)
  findGlobalByName(name: string, excludeDishId?: number) {
    return prisma.dish.findFirst({
      where: {
        is_global: true,
        dish_name: { equals: name, mode: "insensitive" },
        ...(excludeDishId != null ? { dish_id: { not: excludeDishId } } : {}),
      },
      select: { dish_id: true },
    });
  },

  createGlobalWithNutrients(input: {
    adminId: number;
    name: string;
    imageUrl: string;
    nutrients: { nutrientId: number; value: number }[];
  }) {
    return prisma.$transaction(async (tx) => {
      const dish = await tx.dish.create({
        data: {
          dish_name: input.name,
          created_by: input.adminId,
          is_global: true,
          image_url: input.imageUrl,
        },
      });

      await tx.dishNutrient.createMany({
        data: input.nutrients.map((n) => ({
          dish_id: dish.dish_id,
          nutrient_id: n.nutrientId,
          value: n.value,
        })),
      });

      return tx.dish.findUniqueOrThrow({
        where: { dish_id: dish.dish_id },
        select: mineDishSelect,
      });
    });
  },

  updateGlobalWithNutrients(input: {
    dishId: number;
    name: string;
    imageUrl?: string;
    nutrients: { nutrientId: number; value: number }[];
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.dish.findFirst({
        where: { dish_id: input.dishId, is_global: true },
      });
      if (!existing) return null;

      await tx.dish.update({
        where: { dish_id: input.dishId },
        data: {
          dish_name: input.name,
          ...(input.imageUrl !== undefined
            ? { image_url: input.imageUrl }
            : {}),
        },
      });

      await tx.dishNutrient.deleteMany({
        where: { dish_id: input.dishId },
      });
      await tx.dishNutrient.createMany({
        data: input.nutrients.map((n) => ({
          dish_id: input.dishId,
          nutrient_id: n.nutrientId,
          value: n.value,
        })),
      });

      return tx.dish.findUniqueOrThrow({
        where: { dish_id: input.dishId },
        select: mineDishSelect,
      });
    });
  },

  deleteGlobalWithCleanup(dishId: number) {
    return prisma.$transaction(async (tx) => {
      const dish = await tx.dish.findFirst({
        where: { dish_id: dishId, is_global: true },
      });
      if (!dish) return null;

      await cleanupMealsAfterDishDelete(tx, dishId);
      return dish;
    });
  },
};

export const dishRepositoryHelpers = {
  pickMacroValue,
};
