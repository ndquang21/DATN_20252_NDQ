export type NutrientUnit = "kcal" | "g" | "mg" | "mcg";

export type NutrientItem = {
  nutrientId: number;
  name: string;
  isMacro: boolean;
  unit: NutrientUnit;
  isSystemMacro: boolean;
};

export type NutrientListResponse = {
  items: NutrientItem[];
};

export type CreateNutrientPayload = {
  name: string;
  unit: NutrientUnit;
};

export type UpdateNutrientPayload = CreateNutrientPayload;

export const ADMIN_NUTRIENT_UNITS: { value: NutrientUnit; label: string }[] = [
  { value: "g", label: "g" },
  { value: "mg", label: "mg" },
  { value: "mcg", label: "mcg" },
];
