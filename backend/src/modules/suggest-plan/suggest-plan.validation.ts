import { z } from "zod";
import { MAX_SUGGEST_PLAN_DAYS } from "../../constants/suggest-plan";

// ===== Admin: quản lý gói gợi ý =====

// Thứ tự sắp xếp danh sách gói (cho admin)
export const suggestPlanListSortSchema = z.enum([
  "created_desc",
  "created_asc",
  "public_first",
  "hidden_first",
]);

// Query danh sách gói: tìm kiếm + phân trang + sắp xếp
export const listSuggestPlansQuerySchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  sort: suggestPlanListSortSchema.optional().default("created_desc"),
});

// Param :id của 1 gói gợi ý
export const suggestPlanIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Param :id + :dayIndex (1 ngày cụ thể trong gói)
export const suggestPlanDayParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  dayIndex: z.coerce.number().int().min(1).max(MAX_SUGGEST_PLAN_DAYS),
});

// Body tạo gói mới: tên + số ngày ban đầu
export const createSuggestPlanBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên không được để trống")
    .max(200, "Tên tối đa 200 ký tự")
    .optional(),
  dayCount: z.coerce
    .number()
    .int()
    .min(1, "Ít nhất 1 ngày")
    .max(MAX_SUGGEST_PLAN_DAYS, `Tối đa ${MAX_SUGGEST_PLAN_DAYS} ngày`)
    .optional(),
});

// Body sửa tên/mô tả/ảnh, cần ít nhất 1 trường
export const updateSuggestPlanBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Tên không được để trống")
      .max(200, "Tên tối đa 200 ký tự")
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, "Mô tả tối đa 2000 ký tự")
      .nullable()
      .optional(),
    imageUrl: z
      .string()
      .trim()
      .max(2000)
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.imageUrl !== undefined,
    { message: "Cần ít nhất một trường để cập nhật" },
  );

// Body bật/tắt công khai gói
export const publishSuggestPlanBodySchema = z.object({
  isPublic: z.boolean(),
});

// ===== Public: user xem gói đang công khai =====

// Thứ tự sắp xếp danh sách gói công khai (ít lựa chọn hơn bản admin)
export const publicSuggestPlanListSortSchema = z.enum([
  "created_desc",
  "created_asc",
]);

// Query danh sách gói công khai: tìm kiếm + phân trang + sắp xếp
export const listPublicSuggestPlansQuerySchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  sort: publicSuggestPlanListSortSchema.optional().default("created_desc"),
});

// Param :mealId (xem dinh dưỡng 1 bữa trong gói công khai)
export const suggestPlanMealIdParamSchema = z.object({
  mealId: z.coerce.number().int().positive(),
});

// ===== Apply: áp dụng gói vào ngày thật của user =====

// Chuỗi ngày dạng YYYY-MM-DD, dùng chung cho các schema apply
const dateStrSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày YYYY-MM-DD");

// Loại bữa hợp lệ khi áp dụng theo scope "meal"
export const applyMealTypeSchema = z.enum([
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

// Body áp dụng gói: rẽ nhánh theo "scope" (cả gói / 1 ngày / 1 bữa)
export const applySuggestPlanBodySchema = z.discriminatedUnion("scope", [
  z.object({
    scope: z.literal("plan"),
    startDate: dateStrSchema,
  }),
  z.object({
    scope: z.literal("day"),
    sourceDayIndex: z.coerce.number().int().min(1).max(MAX_SUGGEST_PLAN_DAYS),
    targetDate: dateStrSchema,
  }),
  z.object({
    scope: z.literal("meal"),
    sourceMealId: z.coerce.number().int().positive(),
    targetDate: dateStrSchema,
    targetMealType: applyMealTypeSchema,
  }),
]);
