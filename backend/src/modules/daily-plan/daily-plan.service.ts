import { dailyPlanRepository } from "./daily-plan.repository";
import { userRepository } from "../user/user.repository";
import { MealType } from "../../../prisma/generated/prisma/client";
import {
  DailyPlanResponseDTO,
  MealNutrientsDTO,
  NutrientValueDTO,
  TrackedNutrientDayDTO,
} from "./daily-plan.dto";
import { suggestPlanService } from "../suggest-plan/suggest-plan.service";
import { parseDateOnly, formatDateOnly } from "../../utils/date.util";
import { round2, buildMealsAndSummary } from "../../utils/meal.util";
import { appError } from "../../utils/http.util";

type MealContext = {
  daily_plan_id: number;
  daily_plan: {
    user_id: number;
    daily_plan_date: Date;
    is_template: boolean;
  };
};

//Nếu bữa vừa sửa thuộc 1 template (gợi ý), kiểm tra lại xem có còn đủ điều kiện công khai không
async function revalidateSuggestPlanIfTemplate(dailyPlanId: number) {
  //ngày (dailyPlanId) vừa sửa này có phải là 1 ngày thuộc gói gợi ý không?
  const link =
    await dailyPlanRepository.findSuggestPlanIdByDailyPlanId(dailyPlanId);
  // Nếu có liên kết (đúng là 1 ngày thuộc gói gợi ý)
  if (link) {
    await suggestPlanService.revalidatePublicStatus(link.suggest_plan_id);
  }
}

// Đóng gói plan (tải theo id) thành response cho FE
function toDailyPlanResponse(
  plan: NonNullable<
    Awaited<ReturnType<typeof dailyPlanRepository.findByIdWithMeals>>
  >,
): DailyPlanResponseDTO {
  const { meals, summary } = buildMealsAndSummary(plan.daily_menus);

  return {
    date: formatDateOnly(plan.daily_plan_date),
    hasPlan: true,
    summary,
    meals,
    trackedNutrients: [],
  };
}


// reload sau khi sửa chi tiết món ăn (tùy theo nơi dùng)
async function reloadPlanAfterMealEdit(
  userId: number,
  ctx: MealContext,
): Promise<DailyPlanResponseDTO> {
  // Nếu dùng trong trang của admin thì tìm theo id
  if (ctx.daily_plan.is_template) {
    const plan = await dailyPlanRepository.findByIdWithMeals(ctx.daily_plan_id);
    if (!plan) {
      return {
        date: formatDateOnly(ctx.daily_plan.daily_plan_date),
        hasPlan: false,
        summary: null,
        meals: [],
        trackedNutrients: [],
      };
    }
    return toDailyPlanResponse(plan);
  }

  // Nếu dùng trng trang Home của user thì tìm theo user + date
  return dailyPlanService.getDailyPlan(
    userId,
    formatDateOnly(ctx.daily_plan.daily_plan_date),
  );
}

type RawDayPlan = NonNullable<
  Awaited<ReturnType<typeof dailyPlanRepository.findByUserAndDate>>
>;

type TrackedRow = Awaited<
  ReturnType<typeof userRepository.findTrackedNutrients>
>[number];

// Với mỗi chất user đang theo dõi, cộng dồn giá trị chất đó
// từ các bữa ĐÃ ĐÁNH DẤU ăn xong trong kế hoạch của ngày
function buildTrackedNutrientsFromPlan(
  plan: RawDayPlan | null,
  trackedRows: TrackedRow[],
): TrackedNutrientDayDTO[] {
  return trackedRows.map((trackedRow) => {
    let completedValue = 0;

    if (plan) {
      for (const dailyMenu of plan.daily_menus) {
        const meal = dailyMenu.meal;
        if (!meal.is_finished) continue; // bữa chưa ăn xong -> bỏ qua, không tính

        for (const mealMenu of meal.meal_menus) {
          for (const dishNutrient of mealMenu.dish.dish_nutrients) {
            // Chỉ cộng đúng chất đang xét (trackedRow), bỏ qua chất khác của món
            if (dishNutrient.nutrient_id === trackedRow.nutrient_id) {
              completedValue += dishNutrient.value * mealMenu.quantity;
            }
          }
        }
      }
    }

    return {
      sortOrder: trackedRow.sort_order,
      nutrientId: trackedRow.nutrient.nutrient_id,
      name: trackedRow.nutrient.name,
      unit: trackedRow.nutrient.unit,
      completed: round2(completedValue),
    };
  });
}

export const dailyPlanService = {
  // Lấy kế hoạch ăn uống của user cho 1 ngày cụ thể.
  // Nếu ngày đó chưa có kế hoạch nào -> trả về "chưa có" (hasPlan: false).
  async getDailyPlan(
    userId: number,
    dateStr: string,
  ): Promise<DailyPlanResponseDTO> {
    // Chuỗi "2026-07-07" -> đối tượng Date thật để query DB.
    const date = parseDateOnly(dateStr);

    // Chạy song song 2 việc không phụ thuộc nhau: tìm kế hoạch của ngày này,
    // và lấy danh sách chất dinh dưỡng user đang muốn theo dõi.
    const [plan, trackedNutrientRows] = await Promise.all([
      dailyPlanRepository.findByUserAndDate(userId, date),
      userRepository.findTrackedNutrients(userId),
    ]);

    // Tính sẵn phần "đã theo dõi" (dùng chung cho cả 2 nhánh có/không có kế hoạch)
    const trackedNutrients = buildTrackedNutrientsFromPlan(
      plan,
      trackedNutrientRows,
    );

    // TH1: ngày này CHƯA có kế hoạch -> trả về rỗng, không có bữa ăn nào
    if (!plan) {
      return {
        date: dateStr,
        hasPlan: false,
        summary: null,
        meals: [],
        trackedNutrients,
      };
    }

    // TH2: đã có kế hoạch -> tính calo/macro từng bữa + tổng cả ngày.
    const { meals, summary } = buildMealsAndSummary(plan.daily_menus);

    return {
      date: dateStr,
      hasPlan: true,
      summary,
      meals,
      trackedNutrients,
    };
  },


  // Set hoàn thành bữa ăn
  async setMealFinished(userId: number, mealId: number, isFinished: boolean) {
    const owner = await dailyPlanRepository.findMealOwner(mealId);
    if (!owner || owner.daily_plan.user_id !== userId) {
      return null;
    }
    await dailyPlanRepository.setMealFinished(mealId, isFinished);
    return { mealId, isFinished };
  },

  // Xem ĐẦY ĐỦ mọi chất dinh dưỡng của 1 bữa,
  // breakdown theo từng món + tổng cả bữa. Dùng khi bấm xem chi tiết bữa ăn
  async getMealNutrients(
    userId: number,
    mealId: number,
  ): Promise<MealNutrientsDTO | null> {
    const meal = await dailyPlanRepository.findMealWithNutrients(mealId);
    if (!meal) return null;

    // Kiểm tra đúng chủ sở hữu: bữa này có thuộc kế hoạch của user đang gọi không.
    const ownerId = meal.daily_menus[0]?.daily_plan?.user_id;
    if (ownerId !== userId) return null;

    // Danh mục tất cả chất dinh dưỡng trong hệ thống
    // dùng làm khuôn chung để mọi món/bữa đều liệt kê đủ chất theo cùng thứ tự
    const nutrientCatalog = await dailyPlanRepository.findAllNutrients();

    // Với mỗi món trong bữa: tính giá trị từng chất (đã nhân khẩu phần).
    const dishes = meal.meal_menus.map((mealMenu) => {
      // Tra cứu nhanh: id chất -> giá trị (trên 100g) của món này.
      const nutrientValueById = new Map<number, number>();
      for (const dishNutrient of mealMenu.dish.dish_nutrients) {
        nutrientValueById.set(dishNutrient.nutrient_id, dishNutrient.value);
      }

      // Duyệt qua toàn bộ danh mục chất,
      // chất nào món không khai -> coi giá trị trên 100g là 0.
      const nutrientsOfThisDish: NutrientValueDTO[] = nutrientCatalog.map(
        (nutrient) => {
          const valuePer100g = nutrientValueById.get(nutrient.nutrient_id) ?? 0;
          const actualValue = valuePer100g * mealMenu.quantity;
          return {
            nutrientId: nutrient.nutrient_id,
            name: nutrient.name,
            unit: nutrient.unit,
            isMacro: nutrient.is_macro,
            value: round2(actualValue),
          };
        },
      );

      return {
        dishId: mealMenu.dish.dish_id,
        name: mealMenu.dish.dish_name,
        quantity: mealMenu.quantity,
        grams: Math.round(mealMenu.quantity * 100),
        nutrients: nutrientsOfThisDish,
      };
    });

    // Tổng cả bữa cho từng chất = cộng giá trị chất đó của tất cả món trong bữa.
    // Vì mọi món đều liệt kê đủ chất theo ĐÚNG THỨ TỰ nutrientCatalog, chất thứ
    // "nutrientIndex" của món nào cũng ứng với cùng 1 chất -> cộng theo cùng vị trí.
    const totalsOfMeal: NutrientValueDTO[] = nutrientCatalog.map(
      (nutrient, nutrientIndex) => {
        let sumForThisNutrient = 0;
        for (const dish of dishes) {
          sumForThisNutrient += dish.nutrients[nutrientIndex].value;
        }
        return {
          nutrientId: nutrient.nutrient_id,
          name: nutrient.name,
          unit: nutrient.unit,
          isMacro: nutrient.is_macro,
          value: round2(sumForThisNutrient),
        };
      },
    );

    return {
      mealId: meal.meal_id,
      type: meal.meal_type,
      totals: totalsOfMeal,
      dishes,
    };
  },


  // Thêm món vào bữa
  async addDishToMeal(
    userId: number,
    mealId: number,
    dishId: number,
    grams: number,
  ): Promise<DailyPlanResponseDTO> {
    // Kiểm tra quyền
    const ctx = await dailyPlanRepository.findMealContext(mealId);
    if (!ctx || ctx.daily_plan.user_id !== userId) {
      throw appError("Không tìm thấy bữa ăn hoặc bạn không có quyền", 404);
    }
    // Kiểm tra món tồn tại hay đã có trong bữa k?
    const dish = await dailyPlanRepository.findAccessibleDish(dishId, userId);
    if (!dish) throw appError("Không tìm thấy món ăn", 404);
    const existing = await dailyPlanRepository.findMealMenu(mealId, dishId);
    if (existing) throw appError("Món đã có trong bữa", 409);

    // Gọi repo
    await dailyPlanRepository.addMealMenu(mealId, dishId, grams / 100);

    // Nếu là template thì kiểm tra lại trạng thái công khai
    if (ctx.daily_plan.is_template) {
      await revalidateSuggestPlanIfTemplate(ctx.daily_plan_id);
    }

    // reload lại thông tin
    return reloadPlanAfterMealEdit(userId, ctx);
  },

  // Sửa bữa
  async updateMealDishGrams(
    userId: number,
    mealId: number,
    dishId: number,
    grams: number,
  ): Promise<DailyPlanResponseDTO> {
    // Kiểm tra
    const ctx = await dailyPlanRepository.findMealContext(mealId);
    if (!ctx || ctx.daily_plan.user_id !== userId) {
      throw appError("Không tìm thấy bữa ăn hoặc bạn không có quyền", 404);
    }
    const existing = await dailyPlanRepository.findMealMenu(mealId, dishId);
    if (!existing) throw appError("Món không có trong bữa", 404);

    // Gọi repo
    await dailyPlanRepository.updateMealMenuQuantity(mealId, dishId, grams / 100);

    // Nếu là template thì kiểm tra lại trạng thái công khai
    if (ctx.daily_plan.is_template) {
      await revalidateSuggestPlanIfTemplate(ctx.daily_plan_id);
    }

    // reload lại thông tin
    return reloadPlanAfterMealEdit(userId, ctx);
  },

  // Xóa món trong bữa (kèm kiểm tra xóa bữa và plan luôn nếu hết - removeMealDishWithCleanup)
  async removeMealDish(
    userId: number,
    mealId: number,
    dishId: number,
  ): Promise<DailyPlanResponseDTO> {
    // Kiểm tra
    const ctx = await dailyPlanRepository.findMealContext(mealId);
    if (!ctx || ctx.daily_plan.user_id !== userId) {
      throw appError("Không tìm thấy bữa ăn hoặc bạn không có quyền", 404);
    }
    const existing = await dailyPlanRepository.findMealMenu(mealId, dishId);
    if (!existing) throw appError("Món không có trong bữa", 404);

    // Gọi repo
    await dailyPlanRepository.removeMealDishWithCleanup(
      ctx.daily_plan_id,
      mealId,
      dishId,
    );

    // Nếu là template thì kiểm tra lại trạng thái công khai
    if (ctx.daily_plan.is_template) {
      await revalidateSuggestPlanIfTemplate(ctx.daily_plan_id);
    }
    // reload lại thông tin
    return reloadPlanAfterMealEdit(userId, ctx);
  },

  // Tạo bữa (2 hướng: tạo cho template/ ngày thường của user)
  async createMeal(
    userId: number,
    input: {
      date?: string;
      dailyPlanId?: number;
      mealType: MealType;
      dishId: number;
      grams: number;
    },
  ): Promise<{ mealId: number; plan: DailyPlanResponseDTO }> {
    // Kiểm tra món hợp lệ
    const dish = await dailyPlanRepository.findAccessibleDish(
      input.dishId,
      userId,
    );
    if (!dish) throw appError("Không tìm thấy món ăn", 404);

    // 1. Tìm đúng ngày template, và thuộc sở hữu của userId (admin) — ko thấy -> forbidden
    if (input.dailyPlanId !== undefined) {
      const plan = await dailyPlanRepository.findTemplatePlanWithMealTypes(
        input.dailyPlanId,
        userId,
      );
      if (!plan) {
        throw appError("Không tìm thấy bữa ăn hoặc bạn không có quyền", 404);
      }

      // nếu đang tạo bữa không phải phụ (sáng/trưa/tối), kiểm tra ngày đó đã có bữa loại này chưa
      // snack được nhiều bữa 1 ngày
      if (input.mealType !== "snack") {
        const dup = plan.daily_menus.some( //có ptử nào tm đkiện ko, trả về boolean
          (dm) => dm.meal.meal_type === input.mealType,
        );
        if (dup) {
          throw appError("Loại bữa này đã tồn tại trong ngày", 409);
        }
      }

      // gắn vào đúng plan.daily_plan_id đã có sẵn, không tạo DailyPlan mới vì template đã tồn tại từ trước
      const mealId = await dailyPlanRepository.createMealWithFirstDish(
        userId,
        plan.daily_plan_date,
        input.mealType,
        input.dishId,
        input.grams / 100,
        plan.daily_plan_id,
      );

      // Kiểm tra lại trạng thái "có thể công khai"
      await revalidateSuggestPlanIfTemplate(plan.daily_plan_id);

      // Tải lại theo id
      const loaded = await dailyPlanRepository.findByIdWithMeals(
        plan.daily_plan_id,
      );
      const result = loaded
        ? toDailyPlanResponse(loaded)
        : {
            date: formatDateOnly(plan.daily_plan_date),
            hasPlan: false,
            summary: null,
            meals: [],
            trackedNutrients: [],
          };

      return { mealId, plan: result };
    }

    // 2. Tạo bữa cho ngày thường của user
    if (!input.date) {
      throw appError("Không tìm thấy bữa ăn hoặc bạn không có quyền", 404);
    }

    const date = parseDateOnly(input.date);
    const plan = await dailyPlanRepository.findPlanWithMealTypes(userId, date);

    // Kiểm tra trùng bữa đã tồn tại
    if (plan && input.mealType !== "snack") {
      const dup = plan.daily_menus.some(
        (dm) => dm.meal.meal_type === input.mealType,
      );
      if (dup) {
        throw appError("Loại bữa này đã tồn tại trong ngày", 409);
      }
    }

    // Tạo bữa
    const mealId = await dailyPlanRepository.createMealWithFirstDish(
      userId,
      date,
      input.mealType,
      input.dishId,
      input.grams / 100,
      plan?.daily_plan_id,
    );

    // Tải lại trang
    const result = await dailyPlanService.getDailyPlan(userId, input.date);
    return { mealId, plan: result };
  },
};