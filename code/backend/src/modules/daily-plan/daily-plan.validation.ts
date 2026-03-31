import { z } from "zod";

export const getDailyPlanQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tham số 'date' cần dạng YYYY-MM-DD"),
});

export const finishMealSchema = z.object({
  isFinished: z.boolean(),
});

export const createMealSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tham số 'date' cần dạng YYYY-MM-DD")
      .optional(),
    dailyPlanId: z.coerce.number().int().positive().optional(),
    mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
    dishId: z.number().int().positive(),
    grams: z.number().positive().max(100000),
  })
  .refine((data) => data.date !== undefined || data.dailyPlanId !== undefined, {
    message: "Cần truyền date (user) hoặc dailyPlanId (template gợi ý)",
  });export const addDishSchema = z.object({
  dishId: z.number().int().positive(),
  grams: z.number().positive().max(100000),
});export const updateDishSchema = z.object({
  grams: z.number().positive().max(100000),
});
