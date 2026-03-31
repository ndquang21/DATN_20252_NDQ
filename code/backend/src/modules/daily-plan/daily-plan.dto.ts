import { MealType, NutrientUnit } from "../../../prisma/generated/prisma/client";

export type DishItemDTO = {
  dishId: number;
  name: string;
  imageUrl: string | null;
  quantity: number;
  grams: number;
  calories: number; // kcal của món trong bữa (đã nhân khẩu phần)
};

export type MealItemDTO = {
  mealId: number;
  type: MealType;
  isFinished: boolean;
  calories: number;
  protein: number;
  carb: number;
  fat: number;
  coverImageUrl: string | null;
  dishes: DishItemDTO[];
};

export type NutrientTotalsDTO = {
  calories: number;
  protein: number;
  carb: number;
  fat: number;
};

export type DailyPlanSummaryDTO = {
  total: NutrientTotalsDTO; // tổng kế hoạch của ngày
  completed: NutrientTotalsDTO; // phần đã tick hoàn thành
};

export type TrackedNutrientDayDTO = {
  sortOrder: number;
  nutrientId: number;
  name: string;
  unit: NutrientUnit;
  completed: number;
};

export type DailyPlanResponseDTO = {
  date: string;
  hasPlan: boolean;
  summary: DailyPlanSummaryDTO | null;
  meals: MealItemDTO[];
  trackedNutrients: TrackedNutrientDayDTO[];
};

export type NutrientValueDTO = {
  nutrientId: number;
  name: string;
  unit: NutrientUnit;
  isMacro: boolean;
  value: number; // đã nhân khẩu phần (lượng thực nạp)
};

export type DishNutrientsDTO = {
  dishId: number;
  name: string;
  quantity: number;
  grams: number;
  nutrients: NutrientValueDTO[];
};

export type MealNutrientsDTO = {
  mealId: number;
  type: MealType;
  totals: NutrientValueDTO[]; // tổng 24 chất của cả bữa
  dishes: DishNutrientsDTO[]; // breakdown từng món
};