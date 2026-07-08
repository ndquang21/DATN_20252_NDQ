import { prisma } from "../../config/prisma";
import { MealType } from "../../../prisma/generated/prisma/client";
import { DAILY_PLAN_NUTRIENT_NAMES } from "../../constants/nutrient-names";

const MACRO_NUTRIENT_NAMES = [...DAILY_PLAN_NUTRIENT_NAMES];
export const dailyPlanRepository = {
  // ===== User: xem/sửa kế hoạch ngày của chính mình =====

  // Lấy kế hoạch ngày (getDailyPlan)
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

  // Kiểm chủ sở hữu bữa (setMealFinished)
  findMealOwner(mealId: number) {
    return prisma.dailyMenu.findFirst({
      where: { meal_id: mealId },
      include: { daily_plan: { select: { user_id: true } } },
    });
  },

  // Đánh dấu ăn xong/chưa
  setMealFinished(mealId: number, isFinished: boolean) {
    return prisma.meal.update({
      where: { meal_id: mealId },
      data: { is_finished: isFinished },
    });
  },

  // Lấy bối cảnh bữa (ctx) — dùng cho 3 hàm sửa món
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

  // Tìm món ăn được tiếp cận (món hệ thống hoặc món do chính user tạo)
  findAccessibleDish(dishId: number, userId: number) {
    return prisma.dish.findFirst({
      where: {
        dish_id: dishId,
        OR: [{ is_global: true }, { created_by: userId }],
      },
      select: { dish_id: true },
    });
  },

  // Kiểm món đã có trong bữa chưa
  findMealMenu(mealId: number, dishId: number) {
    return prisma.mealMenu.findUnique({
      where: { meal_id_dish_id: { meal_id: mealId, dish_id: dishId } },
      select: { meal_id: true },
    });
  },

  // Kiểm trùng loại bữa khi tạo (ngày thường)
  findPlanWithMealTypes(userId: number, date: Date) {
    return prisma.dailyPlan.findFirst({
      where: { user_id: userId, daily_plan_date: date },
      select: {
        daily_plan_id: true,
        daily_menus: { select: { meal: { select: { meal_type: true } } } },
      },
    });
  },

  // Kiểm trùng loại bữa khi tạo (template)
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

  // Thêm món vào bữa
  addMealMenu(mealId: number, dishId: number, quantity: number) {
    return prisma.mealMenu.create({
      data: { meal_id: mealId, dish_id: dishId, quantity },
    });
  },

  // Sửa số gram của món
  updateMealMenuQuantity(mealId: number, dishId: number, quantity: number) {
    return prisma.mealMenu.update({
      where: { meal_id_dish_id: { meal_id: mealId, dish_id: dishId } },
      data: { quantity },
    });
  },

  // Xóa món kèm kiểm tra xóa bữa và ngày
  removeMealDishWithCleanup(planId: number, mealId: number, dishId: number) {
    return prisma.$transaction(async (tx) => {
      // Xóa món đã chọn
      await tx.mealMenu.delete({
        where: { meal_id_dish_id: { meal_id: mealId, dish_id: dishId } },
      });

      // Còn món nào trong bữa không?
      const remainingDishes = await tx.mealMenu.count({
        where: { meal_id: mealId },
      });

      if (remainingDishes === 0) {
        // Xóa bữa
        await tx.meal.delete({ where: { meal_id: mealId } });

        // Còn bữa nào trong ngày không?
        const remainingMeals = await tx.dailyMenu.count({
          where: { daily_plan_id: planId },
        });

        if (remainingMeals === 0) {
          // Kiểm tra xem ngày đó có phải template?
          const plan = await tx.dailyPlan.findUnique({
            where: { daily_plan_id: planId },
            select: { is_template: true },
          });
          // Không phải thì xóa
          if (!plan?.is_template) {
            await tx.dailyPlan.delete({ where: { daily_plan_id: planId } });
          }
        }
      }
    });
  },

  // Tạo bữa mới với 1 món đầu (dùng cho cả ngày thường lẫn template)
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
      // Nếu daily plan chưa tồn tại thì tạo mới
      if (!planId) {
        const created = await tx.dailyPlan.create({
          data: { user_id: userId, daily_plan_date: date },
          select: { daily_plan_id: true },
        });
        planId = created.daily_plan_id;
      }
      // Tạo bữa và các liên kết
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

  // ===== Dùng chung: cả daily-plan (user) lẫn suggest-plan (admin) đều gọi =====

  // Xem chi tiết dinh dưỡng 1 bữa — cả user và admin xem preview gói gợi ý
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

  // Lấy danh mục đầy đủ chất dinh dưỡng 
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

  // Tải 1 kế hoạch theo ID trực tiếp — tải lại sau khi sửa template,
  // lẫn xem chi tiết gói gợi ý
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

  // Tra ngược: ngày này có thuộc gói gợi ý nào không
  findSuggestPlanIdByDailyPlanId(dailyPlanId: number) {
    return prisma.suggestPlanDay.findFirst({
      where: { daily_plan_id: dailyPlanId },
      select: { suggest_plan_id: true },
    });
  },

  // ===== Apply: copy dữ liệu từ gói gợi ý (template) sang ngày thật của user =====

  // Xóa lịch đã tồn tại của user để apply lịch mới (áp dụng cả ngày)
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

  // Tìm xem ngày này đã có bữa loại X chưa (sáng/trưa/tối - tối đa 1 bữa/ngày)
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

  // Xóa 1 bữa đơn (sáng/trưa/tối) trước khi tạo lại bữa mới thay thế
  async deleteUserMeal(mealId: number) {
    await prisma.$transaction(async (tx) => {
      await tx.mealMenu.deleteMany({ where: { meal_id: mealId } });
      await tx.dailyMenu.deleteMany({ where: { meal_id: mealId } });
      await tx.meal.delete({ where: { meal_id: mealId } });
    });
  },

  // Xóa hết các bữa CÙNG LOẠI trong 1 ngày (dùng cho bữa phụ, vì mỗi ngày
  // có thể có nhiều bữa phụ, khác sáng/trưa/tối mặc định 1 bữa/ngày).
  // Dọn sạch trước khi copy bữa phụ mới từ template vào.
  async deleteUserMealsByTypeOnDate(
    userId: number,
    date: Date,
    mealType: MealType,
  ) {
    const plan = await prisma.dailyPlan.findFirst({
      // Tìm kế hoạch ngày thường
      where: {
        user_id: userId,
        daily_plan_date: date,
        is_template: false,
      },
      include: {
        // lấy những daily_menus mà meal của nó đúng loại mealType
        daily_menus: {
          where: { meal: { meal_type: mealType } },
          select: { meal_id: true },
        },
      },
    });
    if (!plan) return; // Không có thì return (không có gì để xóa)

    await prisma.$transaction(async (tx) => {
      // Duyệt qua từng bữa phụ tìm được
      for (const dm of plan.daily_menus) {
        await tx.mealMenu.deleteMany({ where: { meal_id: dm.meal_id } }); // xóa món trong bữa
        await tx.dailyMenu.deleteMany({ where: { meal_id: dm.meal_id } }); // xóa liên kết
        await tx.meal.delete({ where: { meal_id: dm.meal_id } }); // xóa bữa
      }

      // Kiểm tra cả ngày còn bữa nào không?
      const remaining = await tx.dailyMenu.count({
        where: { daily_plan_id: plan.daily_plan_id },
      });
      // Nếu không thì xóa luôn DailyPlan
      if (remaining === 0) {
        await tx.dailyPlan.delete({
          where: { daily_plan_id: plan.daily_plan_id },
        });
      }
    });
  },

  // Tạo bữa mới nhận cả 1 danh sách món và thêm hết vào bữa cùng lúc —
  // dùng khi copy từ template (1 bữa có nhiều món) sang ngày thật của user
  async createMealWithDishes(
    userId: number,
    date: Date,
    mealType: MealType,
    dishes: { dishId: number; quantity: number }[],
    existingPlanId?: number,
  ): Promise<number> {
    return prisma.$transaction(async (tx) => {
      let planId = existingPlanId;

      // Tra xem ngày này đã có kế hoạch chưa?
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

      // Tạo mới daily plan
      if (!planId) {
        const created = await tx.dailyPlan.create({
          data: { user_id: userId, daily_plan_date: date },
          select: { daily_plan_id: true },
        });
        planId = created.daily_plan_id;
      }

      // Tạo bữa mới vào bảng meal và daily_menu
      const meal = await tx.meal.create({
        data: { meal_type: mealType },
        select: { meal_id: true },
      });
      await tx.dailyMenu.create({
        data: { daily_plan_id: planId, meal_id: meal.meal_id },
      });

      // Tạo món vào bữa đó (bảng meal_menu)
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
