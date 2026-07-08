import { prisma } from "../../config/prisma";
import { Prisma } from "../../../prisma/generated/prisma/client";
import {
  LOCKED_MACRO_NAMES,
  NUTRIENT_NAMES,
} from "../../constants/nutrient-names";

const MACRO_NAMES = [...LOCKED_MACRO_NAMES];

const dishSummarySelect = {
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

// Dựng điều kiện where cho món hệ thống: is_global: true + lọc theo tên nếu có search
function buildGlobalDishWhere(search: string): Prisma.DishWhereInput {
  const where: Prisma.DishWhereInput = { is_global: true };
  if (search) {
    where.dish_name = { contains: search, mode: "insensitive" };
  }
  return where;
}


// Dựng điều kiện where cho món user được phép xem (món hệ thống HOẶC món do chính họ tạo)
function buildAccessibleDishWhere(userId: number, search: string): Prisma.DishWhereInput {
  const where: Prisma.DishWhereInput = {
    OR: [{ is_global: true }, { created_by: userId }],
  };
  if (search) {
    where.dish_name = { contains: search, mode: "insensitive" };
  }
  return where;
}


// Xóa dây chuyền khi xóa 1 món: xóa hết bữa ăn đang chứa món đó, kèm dọn tiếp nếu bữa/ngày rỗng
async function cleanupMealsAfterDishDelete(
  tx: Prisma.TransactionClient,
  dishId: number,
) {
  // Tìm tất cả bữa ăn đang chứa món này (qua bảng nối MealMenu).
  const mealMenuRows = await tx.mealMenu.findMany({
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

  // Gom danh sách meal_id bị ảnh hưởng, loại trùng bằng Set.
  const mealIdsFound = mealMenuRows.map((row) => {
    return row.meal_id;
  });
  const uniqueMealIds = new Set(mealIdsFound);
  const affectedMealIds = [...uniqueMealIds];

  // Xóa món khỏi bảng Dish
  await tx.dish.delete({ where: { dish_id: dishId } });

  // Với mỗi bữa từng chứa món vừa xóa, kiểm tra và xóa nếu rỗng
  for (const mealId of affectedMealIds) {
    const remainingDishesInMeal = await tx.mealMenu.count({
      where: { meal_id: mealId },
    });

    // Bữa này vẫn còn món khác -> không cần dọn, xét bữa tiếp theo.
    if (remainingDishesInMeal > 0) {
      continue;
    }

    // Bữa đã rỗng -> tìm kế hoạch ngày chứa bữa này, phải tìm trước khi
    // xóa bữa, vì xóa xong sẽ không tra ra được nữa
    const dailyMenu = await tx.dailyMenu.findFirst({
      where: { meal_id: mealId },
      select: { daily_plan_id: true },
    });

    // Xóa bữa rỗng
    await tx.meal.delete({ where: { meal_id: mealId } });

    // Kiểm tra tiếp: cả ngày còn bữa nào khác không?
    if (dailyMenu) {
      const remainingMealsInDay = await tx.dailyMenu.count({
        where: { daily_plan_id: dailyMenu.daily_plan_id },
      });

      // Ngày cũng rỗng theo -> xóa luôn kế hoạch ngày đó.
      if (remainingMealsInDay === 0) {
        await tx.dailyPlan.delete({
          where: { daily_plan_id: dailyMenu.daily_plan_id },
        });
      }
    }
  }
}


export const dishRepository = {
  searchDishes(userId: number, search: string, skip: number, take: number) {
    return prisma.dish.findMany({
      where: buildAccessibleDishWhere(userId, search),
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

  countDishes(userId: number, search: string) {
    return prisma.dish.count({ where: buildAccessibleDishWhere(userId, search) });
  },

  listMyDishes(userId: number, skip: number, take: number) {
    return prisma.dish.findMany({
      where: { created_by: userId, is_global: false },
      select: dishSummarySelect,
      orderBy: { created_at: "desc" },
      skip,
      take,
    });
  },

  countMyDishes(userId: number) {
    return prisma.dish.count({
      where: { created_by: userId, is_global: false },
    });
  },

  // Tìm món cá nhân của user bằng tên (unique trong phạm vi user đó)
  findMyDishByName(userId: number, name: string, excludeDishId?: number) {
    return prisma.dish.findFirst({
      where: {
        created_by: userId,
        is_global: false,
        dish_name: { equals: name, mode: "insensitive" },
        ...(excludeDishId != null ? { dish_id: { not: excludeDishId } } : {}),
      },
      select: { dish_id: true },
    });
  },

  createMyDishWithNutrients(input: {
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
        select: dishSummarySelect,
      });
    });
  },

  findMyDishById(userId: number, dishId: number) {
    return prisma.dish.findFirst({
      where: { dish_id: dishId, created_by: userId, is_global: false },
      select: dishDetailSelect,
    });
  },

  updateMyDishWithNutrients(input: {
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
        select: dishSummarySelect,
      });
    });
  },

  deleteMyDishWithCleanup(userId: number, dishId: number) {
    return prisma.$transaction(async (tx) => {
      const dish = await tx.dish.findFirst({
        where: { dish_id: dishId, created_by: userId, is_global: false },
      });
      if (!dish) return null;

      await cleanupMealsAfterDishDelete(tx, dishId);

      return dish;
    });
  },

  listGlobalDishes(search: string, skip: number, take: number) {
    return prisma.dish.findMany({
      where: buildGlobalDishWhere(search),
      select: dishSummarySelect,
      orderBy: { dish_name: "asc" },
      skip,
      take,
    });
  },

  countGlobalDishes(search: string) {
    return prisma.dish.count({ where: buildGlobalDishWhere(search) });
  },

  findGlobalDishById(dishId: number) {
    return prisma.dish.findFirst({
      where: { dish_id: dishId, is_global: true },
      select: dishDetailSelect,
    });
  },

  // Tìm món hệ thống bằng tên (unique, không phụ thuộc admin tạo)
  findGlobalDishByName(name: string, excludeDishId?: number) {
    return prisma.dish.findFirst({
      where: {
        is_global: true,
        dish_name: { equals: name, mode: "insensitive" },
        ...(excludeDishId != null ? { dish_id: { not: excludeDishId } } : {}),
      },
      select: { dish_id: true },
    });
  },

  createGlobalDishWithNutrients(input: {
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
        select: dishSummarySelect,
      });
    });
  },

  updateGlobalDishWithNutrients(input: {
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
        select: dishSummarySelect,
      });
    });
  },

  deleteGlobalDishWithCleanup(dishId: number) {
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
