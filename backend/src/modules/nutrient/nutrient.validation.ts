import { z } from "zod";

const nutrientUnitSchema = z.enum(["kcal", "g", "mg", "mcg"]);

export const createNutrientBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên chất không được để trống")
    .max(100, "Tên chất tối đa 100 ký tự"),
  unit: nutrientUnitSchema,
});

export const updateNutrientBodySchema = createNutrientBodySchema;
