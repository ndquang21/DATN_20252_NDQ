// Định nghĩa tên các chất dinh dưỡng
export const NUTRIENT_NAMES = {
    CALORIES: "Calories",
    PROTEIN: "Protein",
    CARBOHYDRATE: "Carbohydrate",
    FAT: "Fat",
  } as const;
  
// Danh sách các chất bắt buộc
export const LOCKED_MACRO_NAMES = [
  NUTRIENT_NAMES.CALORIES,
  NUTRIENT_NAMES.PROTEIN,
  NUTRIENT_NAMES.CARBOHYDRATE,
  NUTRIENT_NAMES.FAT,
] as const;
  
// Kiểm tra có phải chất bắt buộc
export function isRequiredMacro(name: string): boolean {
  return (LOCKED_MACRO_NAMES as readonly string[]).includes(name);
}