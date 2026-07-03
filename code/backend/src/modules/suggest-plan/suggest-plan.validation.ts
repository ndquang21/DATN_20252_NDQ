import { z } from "zod";
import { MAX_SUGGEST_PLAN_DAYS } from "../../constants/suggest-plan";

export const suggestPlanListSortSchema = z.enum([
  "created_desc",
  "created_asc",
  "public_first",
  "hidden_first",
]);

export const listSuggestPlansQuerySchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  sort: suggestPlanListSortSchema.optional().default("created_desc"),
});

export const suggestPlanIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const suggestPlanDayParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  dayIndex: z.coerce.number().int().min(1).max(MAX_SUGGEST_PLAN_DAYS),
});

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

export const publishSuggestPlanBodySchema = z.object({
  isPublic: z.boolean(),
});
export const publicSuggestPlanListSortSchema = z.enum([
  "created_desc",
  "created_asc",
]);

export const listPublicSuggestPlansQuerySchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  sort: publicSuggestPlanListSortSchema.optional().default("created_desc"),
});

export const suggestPlanMealIdParamSchema = z.object({
  mealId: z.coerce.number().int().positive(),
});

const dateStrSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày YYYY-MM-DD");

export const applyMealTypeSchema = z.enum([
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

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