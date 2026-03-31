export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type NutrientUnit = "kcal" | "g" | "mg" | "mcg";

export type DishItem = {
  dishId: number;
  name: string;
  imageUrl: string | null;
  quantity: number;
  grams: number;
  calories: number;
};

export type MealItem = {
  mealId: number;
  type: MealType;
  isFinished: boolean;
  calories: number;
  protein: number;
  carb: number;
  fat: number;
  coverImageUrl: string | null;
  dishes: DishItem[];
};

export type NutrientTotals = {
  calories: number;
  protein: number;
  carb: number;
  fat: number;
};

export type DailyPlanSummary = {
  total: NutrientTotals;
  completed: NutrientTotals;
};

export type TrackedNutrientDay = {
  sortOrder: number;
  nutrientId: number;
  name: string;
  unit: NutrientUnit;
  completed: number;
};

export type DailyPlanResponse = {
  date: string;
  hasPlan: boolean;
  summary: DailyPlanSummary | null;
  meals: MealItem[];
  trackedNutrients: TrackedNutrientDay[];
};

export type NutrientValue = {
  nutrientId: number;
  name: string;
  unit: NutrientUnit;
  isMacro: boolean;
  value: number;
};

export type DishNutrients = {
  dishId: number;
  name: string;
  quantity: number;
  grams: number;
  nutrients: NutrientValue[];
};

export type MealNutrients = {
  mealId: number;
  type: MealType;
  totals: NutrientValue[];
  dishes: DishNutrients[];
};

export type CreateMealResponse = {
    mealId: number;
    plan: DailyPlanResponse;
  };

  export type CreateMealInput = {
    date?: string;
    dailyPlanId?: number;
    mealType: MealType;
    dishId: number;
    grams: number;
  };