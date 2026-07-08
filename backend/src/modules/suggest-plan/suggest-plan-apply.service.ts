import { MealType } from "../../../prisma/generated/prisma/client";
import { NUTRIENT_NAMES } from "../../constants/nutrient-names";
import { dailyPlanRepository } from "../daily-plan/daily-plan.repository";
import { dailyPlanService } from "../daily-plan/daily-plan.service";
import { userRepository } from "../user/user.repository";
import { userService } from "../user/user.service";
import { suggestPlanRepository } from "./suggest-plan.repository";
import { parseDateOnly, formatDateOnly } from "../../utils/date.util";
import { appError } from "../../utils/http.util";
import type {
  ApplySuggestPlanBodyDTO,
  ApplySuggestPlanResponseDTO,
} from "./suggest-plan.dto";

const N_CAL = NUTRIENT_NAMES.CALORIES;

type TemplateDailyPlan = NonNullable<
  Awaited<ReturnType<typeof suggestPlanRepository.findPublicByIdWithDays>>
>["suggest_plan_days"][number]["daily_plan"];

// Cộng thêm offset ngày vào 1 chuỗi ngày YYYY-MM-DD
function addDays(dateStr: string, offset: number): string {
  const d = parseDateOnly(dateStr);
  d.setUTCDate(d.getUTCDate() + offset);
  return formatDateOnly(d);
}

// Scale gam theo hệ số TDEE, làm tròn bội 5; món quá nhỏ giữ nguyên
function scaleGrams(originalGrams: number, factor: number): number {
  const g = Math.round(originalGrams);
  if (g < 30) return g;
  return Math.floor((g * factor) / 5) * 5;
}

// Đổi gam sang quantity (1 quantity = 100g)
function quantityFromGrams(grams: number): number {
  const g = Math.round(grams);
  return g / 100;
}

// Đổi quantity sang gam (ngược với quantityFromGrams)
function readGramsFromQuantity(quantity: number): number {
  return Math.round(quantity * 100);
}

// Tổng calo 1 ngày mẫu, để tính hệ số scale theo TDEE
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

// Lấy danh sách món của 1 bữa mẫu, có scale gam nếu cần
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

// Lấy TDEE của user: ưu tiên cột đã lưu, không có thì tự tính
async function resolveUserTdee(userId: number): Promise<number | null> {
  const user = await userRepository.findById(userId);
  if (!user) return null;
  if (user.TDEE != null && user.TDEE > 0) return user.TDEE;
  const metrics = userService.calculateTdee(user);
  return metrics?.tdee ?? null;
}

// Áp 1 bữa mẫu vào 1 bữa thật của user (tùy chọn xóa bữa cũ trước)
async function applyTemplateMealToUserDay(
  userId: number,
  targetDate: Date,
  templateMeal: TemplateDailyPlan["daily_menus"][number]["meal"],
  targetMealType: MealType,
  scaleFactor: number | null,
  clearExistingMeal = true,
): Promise<void> {
  // Bữa mẫu rỗng thì không làm gì
  const dishes = extractDishes(templateMeal, scaleFactor);
  if (dishes.length === 0) return;

  // Không cần dọn bữa cũ (vd đã clear cả ngày trước đó) → tạo thẳng
  if (!clearExistingMeal) {
    await dailyPlanRepository.createMealWithDishes(
      userId,
      targetDate,
      targetMealType,
      dishes,
    );
    return;
  }

  // Snack có thể có nhiều bữa → xóa hết snack cùng ngày rồi tạo mới
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

  // Bữa chính (mỗi loại tối đa 1): nếu đã có thì xóa cũ, tạo lại
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

// Áp cả 1 ngày mẫu vào ngày thật: dọn ngày cũ, scale theo TDEE
async function applyTemplateDayToUser(
  userId: number,
  templateDay: TemplateDailyPlan,
  targetDate: Date,
  userTdee: number,
): Promise<void> {
  // Xóa sạch ngày đích trước khi áp mẫu vào
  await dailyPlanRepository.clearUserDay(userId, targetDate);

  // Hệ số scale = TDEE user / tổng calo ngày mẫu (mẫu rỗng thì giữ nguyên)
  const dayCal = templateDayCalories(templateDay);
  const scaleFactor = dayCal > 0 ? userTdee / dayCal : 1;

  // Đã clear cả ngày ở trên nên từng bữa tạo thẳng (clearExistingMeal = false)
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

// Tìm 1 ngày mẫu trong gói theo dayIndex
function findTemplateDay(
  plan: NonNullable<
    Awaited<ReturnType<typeof suggestPlanRepository.findPublicByIdWithDays>>
  >,
  dayIndex: number,
): TemplateDailyPlan | null {
  const row = plan.suggest_plan_days.find((d) => d.day_index === dayIndex);
  return row?.daily_plan ?? null;
}

// Tìm 1 bữa mẫu trong gói theo mealId (duyệt mọi ngày)
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
  // Áp gói gợi ý vào lịch thật: cả gói / 1 ngày / 1 bữa, tùy scope
  async apply(
    userId: number,
    suggestPlanId: number,
    body: ApplySuggestPlanBodyDTO,
  ): Promise<ApplySuggestPlanResponseDTO> {
    // Chỉ áp được từ gói đang công khai
    const plan =
      await suggestPlanRepository.findPublicByIdWithDays(suggestPlanId);
    if (!plan) {
      throw appError("Không tìm thấy thực đơn gợi ý.", 404);
    }

    // Cần TDEE để scale khẩu phần theo nhu cầu của user
    const userTdee = await resolveUserTdee(userId);
    if (!userTdee) {
      throw appError("Cần hoàn thiện hồ sơ (TDEE) trước khi áp dụng.", 400);
    }

    const affectedDates: string[] = [];

    if (body.scope === "plan") {
      // Áp cả gói: mỗi ngày mẫu rơi vào startDate + (dayIndex - 1)
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
      // Áp 1 ngày mẫu vào 1 ngày đích cụ thể
      const templateDay = findTemplateDay(plan, body.sourceDayIndex);
      if (!templateDay) {
        throw appError("Ngày mẫu không hợp lệ.", 400);
      }

      const targetDate = parseDateOnly(body.targetDate);
      await applyTemplateDayToUser(
        userId,
        templateDay,
        targetDate,
        userTdee,
      );
      affectedDates.push(body.targetDate);
    } else {
      // Áp 1 bữa mẫu vào 1 bữa đích (không scale, giữ nguyên khẩu phần mẫu)
      const templateMeal = findTemplateMeal(plan, body.sourceMealId);
      if (!templateMeal) {
        throw appError("Bữa mẫu không hợp lệ.", 400);
      }

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

    // Trả lại các ngày bị ảnh hưởng kèm dữ liệu plan mới nhất của chúng
    return {
      affectedDates,
      plans: await Promise.all(
        affectedDates.map((date) => dailyPlanService.getDailyPlan(userId, date)),
      ),
    };
  },
};