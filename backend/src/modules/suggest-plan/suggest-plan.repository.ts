import { prisma } from "../../config/prisma";
import { Prisma } from "../../../prisma/generated/prisma/client";
import { DAILY_PLAN_NUTRIENT_NAMES } from "../../constants/nutrient-names";
import { MAX_SUGGEST_PLAN_DAYS } from "../../constants/suggest-plan";

const MACRO_NUTRIENT_NAMES = [...DAILY_PLAN_NUTRIENT_NAMES];
const DEFAULT_PLAN_NAME = "Thực đơn mới";

// Template dùng lại bảng daily_plan (bắt buộc có ngày) → gán ngày giả xa (2099) để không đụng lịch thật của user.
function makeTemplatePlanDate(suggestPlanId: number, dayIndex: number): Date {
  const offset = suggestPlanId * 20 + dayIndex;
  const d = new Date("2099-01-01T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

// Include đầy đủ bữa + món + dinh dưỡng macro của 1 ngày
const dailyPlanMealsInclude = {
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
} as const;

// Include rút gọn: chỉ đủ để tính ngày có hoàn chỉnh không
const planDaysForListInclude = {
  suggest_plan_days: {
    orderBy: { day_index: "asc" as const },
    include: {
      daily_plan: {
        include: {
          daily_menus: {
            include: {
              meal: {
                select: {
                  meal_type: true,
                  meal_menus: { select: { dish_id: true } },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

// Where tìm gói theo tên/ mô tả (bản admin)
function buildListWhere(search: string): Prisma.SuggestPlanWhereInput {
  if (!search) return {};
  return {
    OR: [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ],
  };
}

// Where tìm gói công khai: luôn kèm is_public
function buildPublicListWhere(search: string): Prisma.SuggestPlanWhereInput {
  const publicOnly: Prisma.SuggestPlanWhereInput = { is_public: true };
  if (!search) return publicOnly;
  return {
    AND: [
      publicOnly,
      {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      },
    ],
  };
}

// OrderBy danh sách công khai: mới nhất hoặc cũ nhất
function buildPublicListOrderBy(
  sort: "created_desc" | "created_asc",
): Prisma.SuggestPlanOrderByWithRelationInput {
  return sort === "created_asc"
    ? { created_at: "asc" }
    : { created_at: "desc" };
}

export type SuggestPlanListSort =
  | "created_desc"
  | "created_asc"
  | "public_first"
  | "hidden_first";

// OrderBy danh sách admin: thêm ưu tiên công khai/ ẩn
function buildListOrderBy(
  sort: SuggestPlanListSort,
):
  | Prisma.SuggestPlanOrderByWithRelationInput
  | Prisma.SuggestPlanOrderByWithRelationInput[] {
  switch (sort) {
    case "created_asc":
      return { created_at: "asc" };
    case "public_first":
      return [{ is_public: "desc" }, { created_at: "desc" }];
    case "hidden_first":
      return [{ is_public: "asc" }, { created_at: "desc" }];
    default:
      return { created_at: "desc" };
  }
}

export const suggestPlanRepository = {
  // ===== Admin: quản lý gói gợi ý =====

  // Dinh dưỡng 1 ngày: link suggest_plan_day -> daily_plan
  findDailyPlanLink(suggestPlanId: number, dayIndex: number) {
    return prisma.suggestPlanDay.findUnique({
      where: {
        suggest_plan_id_day_index: {
          suggest_plan_id: suggestPlanId,
          day_index: dayIndex,
        },
      },
      select: {
        daily_plan_id: true,
        day_index: true,
      },
    });
  },

  // Danh sách gói (admin), kèm dữ liệu tính ngày hoàn chỉnh
  listForAdmin(
    search: string,
    skip: number,
    take: number,
    sort: SuggestPlanListSort = "created_desc",
  ) {
    return prisma.suggestPlan.findMany({
      where: buildListWhere(search),
      include: planDaysForListInclude,
      orderBy: buildListOrderBy(sort),
      skip,
      take,
    });
  },

  // Đếm tổng số gói khớp tìm kiếm (admin)
  countForAdmin(search: string) {
    return prisma.suggestPlan.count({ where: buildListWhere(search) });
  },

  // Chi tiết 1 gói kèm mọi ngày (admin)
  findByIdWithDays(suggestPlanId: number) {
    return prisma.suggestPlan.findUnique({
      where: { suggest_plan_id: suggestPlanId },
      include: {
        suggest_plan_days: {
          orderBy: { day_index: "asc" },
          include: {
            daily_plan: {
              include: dailyPlanMealsInclude,
            },
          },
        },
      },
    });
  },

  /** null nếu không tồn tại hoặc không phải template hợp lệ */
  async findTemplatePlan(suggestPlanId: number) {
    const plan = await prisma.suggestPlan.findUnique({
      where: { suggest_plan_id: suggestPlanId },
      include: {
        suggest_plan_days: {
          include: {
            daily_plan: {
              select: { is_template: true },
            },
          },
        },
      },
    });
    if (!plan) return null;
    if (plan.suggest_plan_days.length === 0) return null;

    const isValidTemplate = plan.suggest_plan_days.every(
      (d) => d.daily_plan.is_template === true,
    );
    return isValidTemplate ? plan : null;
  },

  // Tạo gói mới kèm ngày trống (transaction)
  createWithEmptyDays(
    adminUserId: number,
    name?: string,
    dayCount = 1,
  ): Promise<number> {
    return prisma.$transaction(async (tx) => {
      const plan = await tx.suggestPlan.create({
        data: {
          name: name?.trim() || DEFAULT_PLAN_NAME,
          day_count: dayCount,
        },
        select: { suggest_plan_id: true },
      });

      for (let dayIndex = 1; dayIndex <= dayCount; dayIndex++) {
        const dailyPlan = await tx.dailyPlan.create({
          data: {
            user_id: adminUserId,
            daily_plan_date: makeTemplatePlanDate(plan.suggest_plan_id, dayIndex),
            is_template: true,
          },
          select: { daily_plan_id: true },
        });

        await tx.suggestPlanDay.create({
          data: {
            suggest_plan_id: plan.suggest_plan_id,
            daily_plan_id: dailyPlan.daily_plan_id,
            day_index: dayIndex,
          },
        });
      }

      return plan.suggest_plan_id;
    });
  },

  // Sửa tên/ mô tả/ ảnh gói
  updateMetadata(suggestPlanId: number, data: Prisma.SuggestPlanUpdateInput) {
    return prisma.suggestPlan.update({
      where: { suggest_plan_id: suggestPlanId },
      data,
    });
  },

  // Bật/tắt công khai gói
  setPublic(suggestPlanId: number, isPublic: boolean) {
    return prisma.suggestPlan.update({
      where: { suggest_plan_id: suggestPlanId },
      data: { is_public: isPublic },
      select: {
        suggest_plan_id: true,
        is_public: true,
      },
    });
  },

  // Xóa gói + toàn bộ daily_plan con (transaction)
  deleteById(suggestPlanId: number) {
    return prisma.$transaction(async (tx) => {
      const days = await tx.suggestPlanDay.findMany({
        where: { suggest_plan_id: suggestPlanId },
        select: { daily_plan_id: true },
      });

      for (const day of days) {
        await tx.dailyPlan.delete({
          where: { daily_plan_id: day.daily_plan_id },
        });
      }

      await tx.suggestPlan.delete({
        where: { suggest_plan_id: suggestPlanId },
      });
    });
  },

  // Thêm 1 ngày trống vào cuối gói (transaction)
  addEmptyDay(suggestPlanId: number, adminUserId: number) {
    return prisma.$transaction(async (tx) => {
      const plan = await tx.suggestPlan.findUnique({
        where: { suggest_plan_id: suggestPlanId },
        select: { day_count: true },
      });
      if (!plan || plan.day_count >= MAX_SUGGEST_PLAN_DAYS) return null;

      const dayIndex = plan.day_count + 1;

      const dailyPlan = await tx.dailyPlan.create({
        data: {
          user_id: adminUserId,
          daily_plan_date: makeTemplatePlanDate(suggestPlanId, dayIndex),
          is_template: true,
        },
        select: { daily_plan_id: true },
      });

      await tx.suggestPlanDay.create({
        data: {
          suggest_plan_id: suggestPlanId,
          daily_plan_id: dailyPlan.daily_plan_id,
          day_index: dayIndex,
        },
      });

      await tx.suggestPlan.update({
        where: { suggest_plan_id: suggestPlanId },
        data: { day_count: dayIndex },
      });

      return {
        dayIndex,
        dailyPlanId: dailyPlan.daily_plan_id,
        dayCount: dayIndex,
      };
    });
  },

  // Xóa 1 ngày theo dayIndex + re-index các ngày sau (transaction)
  removeDayAtIndex(suggestPlanId: number, dayIndex: number) {
    return prisma.$transaction(async (tx) => {
      const plan = await tx.suggestPlan.findUnique({
        where: { suggest_plan_id: suggestPlanId },
        select: { day_count: true },
      });
      if (!plan || plan.day_count <= 1) {
        return { ok: false as const, reason: "min_days" as const };
      }
      if (dayIndex < 1 || dayIndex > plan.day_count) {
        return { ok: false as const, reason: "invalid_day" as const };
      }

      const link = await tx.suggestPlanDay.findUnique({
        where: {
          suggest_plan_id_day_index: {
            suggest_plan_id: suggestPlanId,
            day_index: dayIndex,
          },
        },
        select: { daily_plan_id: true },
      });
      if (!link) {
        return { ok: false as const, reason: "not_found" as const };
      }

      await tx.dailyPlan.delete({
        where: { daily_plan_id: link.daily_plan_id },
      });

      const toReindex = await tx.suggestPlanDay.findMany({
        where: {
          suggest_plan_id: suggestPlanId,
          day_index: { gt: dayIndex },
        },
        orderBy: { day_index: "desc" },
        select: { daily_plan_id: true, day_index: true },
      });

      for (const row of toReindex) {
        await tx.suggestPlanDay.update({
          where: {
            suggest_plan_id_daily_plan_id: {
              suggest_plan_id: suggestPlanId,
              daily_plan_id: row.daily_plan_id,
            },
          },
          data: { day_index: row.day_index - 1 },
        });
      }

      const newDayCount = plan.day_count - 1;
      await tx.suggestPlan.update({
        where: { suggest_plan_id: suggestPlanId },
        data: { day_count: newDayCount },
      });

      return {
        ok: true as const,
        dayCount: newDayCount,
        deletedDayIndex: dayIndex,
      };
    });
  },

  // ===== Public: user xem gói đang công khai =====

  // Kiểm 1 mealId có thuộc gói đang công khai không
  isMealInPublicSuggestPlan(mealId: number) {
    return prisma.meal.findFirst({
      where: {
        meal_id: mealId,
        daily_menus: {
          some: {
            daily_plan: {
              suggest_plan_days: {
                some: {
                  suggest_plan: { is_public: true },
                },
              },
            },
          },
        },
      },
      select: { meal_id: true },
    });
  },

  // Danh sách gói công khai, chỉ lấy trường cần hiển thị
  listPublic(
    search: string,
    skip: number,
    take: number,
    sort: "created_desc" | "created_asc" = "created_desc",
  ) {
    return prisma.suggestPlan.findMany({
      where: buildPublicListWhere(search),
      select: {
        suggest_plan_id: true,
        name: true,
        description: true,
        image_url: true,
        day_count: true,
      },
      orderBy: buildPublicListOrderBy(sort),
      skip,
      take,
    });
  },

  // Đếm tổng số gói công khai khớp tìm kiếm
  countPublic(search: string) {
    return prisma.suggestPlan.count({ where: buildPublicListWhere(search) });
  },

  // Chi tiết 1 gói công khai kèm mọi ngày
  findPublicByIdWithDays(suggestPlanId: number) {
    return prisma.suggestPlan.findFirst({
      where: {
        suggest_plan_id: suggestPlanId,
        is_public: true,
      },
      include: {
        suggest_plan_days: {
          orderBy: { day_index: "asc" },
          include: {
            daily_plan: {
              include: dailyPlanMealsInclude,
            },
          },
        },
      },
    });
  },
};
