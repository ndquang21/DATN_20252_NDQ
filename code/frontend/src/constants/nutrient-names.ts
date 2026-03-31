export const NUTRIENT_NAMES = {
    CALORIES: "Calories",
    PROTEIN: "Protein",
    CARBOHYDRATE: "Carbohydrate",
    FAT: "Fat",
  } as const;
  
  export const LOCKED_MACRO_NAMES = [
    NUTRIENT_NAMES.CALORIES,
    NUTRIENT_NAMES.PROTEIN,
    NUTRIENT_NAMES.CARBOHYDRATE,
    NUTRIENT_NAMES.FAT,
  ] as const;
  
  export function isRequiredMacro(name: string): boolean {
    return (LOCKED_MACRO_NAMES as readonly string[]).includes(name);
  }