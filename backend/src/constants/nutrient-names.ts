export const NUTRIENT_NAMES = {
  CALORIES: "Calories",
  PROTEIN: "Protein",
  CARBOHYDRATE: "Carbohydrate",
  FAT: "Fat",
} as const;

// 4 macro lõi — admin không sửa 
export const LOCKED_MACRO_NAMES = [
  NUTRIENT_NAMES.CALORIES,
  NUTRIENT_NAMES.PROTEIN,
  NUTRIENT_NAMES.CARBOHYDRATE,
  NUTRIENT_NAMES.FAT,
] as const;

export type LockedMacroName = (typeof LOCKED_MACRO_NAMES)[number];

export function isLockedMacroName(name: string): name is LockedMacroName {
  return (LOCKED_MACRO_NAMES as readonly string[]).includes(name);
}

// Macro dùng khi load dish_nutrients cho daily plan / suggest plan 
export const DAILY_PLAN_NUTRIENT_NAMES = [...LOCKED_MACRO_NAMES] as const;
