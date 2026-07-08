import { MealType } from "../../../prisma/generated/prisma/client";
import { round2, buildMealsAndSummary } from "../../utils/meal.util";
import { appError } from "../../utils/http.util";

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


// Ngày đủ hoàn chỉnh chưa, tính từ MealItemDTO đã build
function isDayCompleteFromMeals(meals: MealItemDTO[]): boolean {
  return REQUIRED_MEAL_TYPES.every((type) => {
    const meal = meals.find((m) => m.type === type);
    return !!meal && meal.dishes.length > 0;
  });
}

// Ngày đủ hoàn chỉnh chưa, tính thẳng từ dữ liệu Prisma thô
function isDayCompleteFromRaw(dailyPlan: RawListDailyPlan): boolean {
  const meals = dailyPlan.daily_menus.map((dm) => dm.meal);
  return REQUIRED_MEAL_TYPES.every((type) => {
    const meal = meals.find((m) => m.meal_type === type);
    return !!meal && meal.meal_menus.length > 0;
  });
}

// Tái dùng logic tính bữa + tổng dinh dưỡng của Daily Plan
function toDayMealsAndSummary(dailyPlan: RawDailyPlan): {
  meals: MealItemDTO[];
  summary: DailyPlanSummaryDTO;
} {
  return buildMealsAndSummary(dailyPlan.daily_menus);
}

// Map 1 ngày trong gói (đầy đủ, dùng cho admin)
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

// Map chi tiết đầy đủ 1 gói (đủ ngày, canPublish...)
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

// Map 1 dòng trong danh sách gói (admin)
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

// Map 1 dòng trong danh sách gói công khai
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

// Map chi tiết gói công khai, ẩn dailyPlanId nội bộ
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

// Tính dinh dưỡng đầy đủ 1 bữa, giống hệt Daily Plan
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
  // ===== Admin: quản lý gói gợi ý =====

  // Danh sách gói: tìm kiếm + phân trang + sắp xếp
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

  // Dinh dưỡng đầy đủ 1 ngày trong gói
  async getDayNutrients(
    suggestPlanId: number,
    dayIndex: number,
  ): Promise<SuggestPlanDayNutrientsDTO> {
    const owned = await suggestPlanRepository.findTemplatePlan(suggestPlanId);
    if (!owned) {
      throw appError("Không tìm thấy thực đơn gợi ý.", 404);
    }

    const link = await suggestPlanRepository.findDailyPlanLink(
      suggestPlanId,
      dayIndex,
    );
    if (!link) {
      throw appError("Ngày không tồn tại trong thực đơn này.", 400);
    }

    const planWithMeals = await dailyPlanRepository.findByIdWithMeals(
      link.daily_plan_id,
    );
    if (!planWithMeals) {
      throw appError("Ngày không tồn tại trong thực đơn này.", 400);
    }

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
      dayIndex,
      dailyPlanId: link.daily_plan_id,
      totals,
    };
  },

  // Tạo gói mới, mặc định 1 ngày trống
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

  // Chi tiết 1 gói, gồm mọi ngày
  async getDetail(suggestPlanId: number): Promise<SuggestPlanDetailDTO> {
    const owned = await suggestPlanRepository.findTemplatePlan(suggestPlanId);
    if (!owned) {
      throw appError("Không tìm thấy thực đơn gợi ý.", 404);
    }

    const plan = await suggestPlanRepository.findByIdWithDays(suggestPlanId);
    if (!plan) {
      throw appError("Không tìm thấy thực đơn gợi ý.", 404);
    }

    return toSuggestPlanDetail(plan as RawSuggestPlanWithDays);
  },

  // Sửa tên/ mô tả/ ảnh gói
  async updateMetadata(
    suggestPlanId: number,
    body: UpdateSuggestPlanBodyDTO,
  ): Promise<{ plan: SuggestPlanDetailDTO; oldImageUrl: string | null }> {
    const owned = await suggestPlanRepository.findTemplatePlan(suggestPlanId);
    if (!owned) {
      throw appError("Không tìm thấy thực đơn gợi ý.", 404);
    }

    await suggestPlanRepository.updateMetadata(suggestPlanId, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined
        ? { description: body.description }
        : {}),
      ...(body.imageUrl !== undefined ? { image_url: body.imageUrl } : {}),
    });

    const plan = await suggestPlanRepository.findByIdWithDays(suggestPlanId);
    if (!plan) {
      throw appError("Không tìm thấy thực đơn gợi ý.", 404);
    }

    return {
      plan: toSuggestPlanDetail(plan as RawSuggestPlanWithDays),
      oldImageUrl: owned.image_url,
    };
  },

  // Xóa 1 gói gợi ý
  async remove(suggestPlanId: number): Promise<void> {
    const owned = await suggestPlanRepository.findTemplatePlan(suggestPlanId);
    if (!owned) {
      throw appError("Không tìm thấy thực đơn gợi ý.", 404);
    }

    await suggestPlanRepository.deleteById(suggestPlanId);
  },

  // Bật/tắt công khai gói, chặn nếu chưa đủ ngày
  async publish(
    suggestPlanId: number,
    isPublic: boolean,
  ): Promise<PublishSuggestPlanResponseDTO> {
    const owned = await suggestPlanRepository.findTemplatePlan(suggestPlanId);
    if (!owned) {
      throw appError("Không tìm thấy thực đơn gợi ý.", 404);
    }

    const plan = await suggestPlanRepository.findByIdWithDays(suggestPlanId);
    if (!plan) {
      throw appError("Không tìm thấy thực đơn gợi ý.", 404);
    }

    const detail = toSuggestPlanDetail(plan as RawSuggestPlanWithDays);
    if (isPublic && !detail.canPublish) {
      throw appError("Chưa đủ ngày hoàn chỉnh để công khai.", 400);
    }

    await suggestPlanRepository.setPublic(suggestPlanId, isPublic);

    return {
      suggestPlanId,
      isPublic,
      canPublish: detail.canPublish,
    };
  },

  // Thêm 1 ngày trống vào cuối gói
  async addDay(
    suggestPlanId: number,
    adminUserId: number,
  ): Promise<AddSuggestPlanDayResponseDTO> {
    const owned = await suggestPlanRepository.findTemplatePlan(suggestPlanId);
    if (!owned) {
      throw appError("Không tìm thấy thực đơn gợi ý.", 404);
    }

    const added = await suggestPlanRepository.addEmptyDay(
      suggestPlanId,
      adminUserId,
    );
    if (!added) {
      throw appError("Đã đạt tối đa 14 ngày.", 400);
    }

    const plan = await suggestPlanRepository.findByIdWithDays(suggestPlanId);
    if (!plan) {
      throw appError("Không tìm thấy thực đơn gợi ý.", 404);
    }

    const dayRow = plan.suggest_plan_days.find(
      (d) => d.day_index === added.dayIndex,
    );
    if (!dayRow) {
      throw appError("Không tìm thấy thực đơn gợi ý.", 404);
    }

    const day = toSuggestPlanDay(
      dayRow.day_index,
      dayRow.daily_plan_id,
      dayRow.daily_plan as RawDailyPlan,
    );

    return {
      dayIndex: added.dayIndex,
      dailyPlanId: added.dailyPlanId,
      dayCount: added.dayCount,
      day,
    };
  },

  // Xóa 1 ngày khỏi gói, re-index các ngày sau
  async removeDay(
    suggestPlanId: number,
    dayIndex: number,
  ): Promise<RemoveSuggestPlanDayResponseDTO> {
    const owned = await suggestPlanRepository.findTemplatePlan(suggestPlanId);
    if (!owned) {
      throw appError("Không tìm thấy thực đơn gợi ý.", 404);
    }

    const removed = await suggestPlanRepository.removeDayAtIndex(
      suggestPlanId,
      dayIndex,
    );

    if (!removed.ok) {
      if (removed.reason === "min_days") {
        throw appError("Phải giữ ít nhất 1 ngày.", 400);
      }
      if (removed.reason === "invalid_day") {
        throw appError("Ngày không tồn tại trong thực đơn này.", 400);
      }
      throw appError("Không tìm thấy thực đơn gợi ý.", 404);
    }

    await suggestPlanService.revalidatePublicStatus(suggestPlanId);

    const plan = await suggestPlanRepository.findByIdWithDays(suggestPlanId);
    if (!plan) {
      throw appError("Không tìm thấy thực đơn gợi ý.", 404);
    }

    return {
      dayCount: removed.dayCount,
      deletedDayIndex: removed.deletedDayIndex,
      plan: toSuggestPlanDetail(plan as RawSuggestPlanWithDays),
    };
  },

  // Tự ẩn gói nếu sửa/xóa làm nó không còn đủ điều kiện
  async revalidatePublicStatus(suggestPlanId: number): Promise<void> {
    const plan = await suggestPlanRepository.findByIdWithDays(suggestPlanId);
    if (!plan || !plan.is_public) return;

    const detail = toSuggestPlanDetail(plan as RawSuggestPlanWithDays);
    if (!detail.canPublish) {
      await suggestPlanRepository.setPublic(suggestPlanId, false);
    }
  },

  // ===== Public: user xem gói đang công khai =====

  // Danh sách gói công khai: tìm kiếm + phân trang
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

  // Chi tiết 1 gói công khai cho user xem
  async getPublicDetail(
    suggestPlanId: number,
  ): Promise<SuggestPlanPublicDetailDTO> {
    const plan = await suggestPlanRepository.findPublicByIdWithDays(suggestPlanId);
    if (!plan) {
      throw appError("Không tìm thấy thực đơn gợi ý.", 404);
    }

    return toPublicSuggestPlanDetail(plan as RawSuggestPlanWithDays);
  },

  // Dinh dưỡng 1 bữa trong gói công khai
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
};