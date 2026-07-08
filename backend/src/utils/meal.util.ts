import { DEFAULT_DISH_IMAGE_URL } from "../constants/default-images";
import { NUTRIENT_NAMES } from "../constants/nutrient-names";
import type { MealType } from "../../prisma/generated/prisma/client";
import type {
  DishItemDTO,
  MealItemDTO,
  DailyPlanSummaryDTO,
  NutrientTotalsDTO,
} from "../modules/daily-plan/daily-plan.dto";

const N_CAL = NUTRIENT_NAMES.CALORIES;
const N_PRO = NUTRIENT_NAMES.PROTEIN;
const N_CARB = NUTRIENT_NAMES.CARBOHYDRATE;
const N_FAT = NUTRIENT_NAMES.FAT;

// Thứ tự hiển thị các bữa trong ngày.
export const MEAL_ORDER: Record<string, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
};


// Làm tròn 1 chữ số thập phân.
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}


// Làm tròn 2 chữ số thập phân.
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}


// Khởi tạo tổng dinh dưỡng bằng 0.
export function emptyTotals(): NutrientTotalsDTO {
  return { calories: 0, protein: 0, carb: 0, fat: 0 };
}


// Chọn ảnh cho một bữa: ưu tiên món có ảnh thật, lấy món calo cao nhất.
export function pickCoverImage(dishes: DishItemDTO[]): string {
  // Nếu danh sách rỗng, trả ảnh mặc định của hệ thống
  if (dishes.length === 0) return DEFAULT_DISH_IMAGE_URL;

  // Giữ lại các món có ảnh thực tế và không chứa từ khóa mặc định
  const nonDefault = dishes.filter(
    (d) => d.imageUrl && !d.imageUrl.includes("default_dish"),
  );

  // Xác định tập hợp dữ liệu dùng cho bước so sánh kế tiếp
  const pool = nonDefault.length > 0 ? nonDefault : dishes;

  // Duyệt mảng để tìm ra món có hàm lượng calo lớn nhất
  const cover = pool.reduce(
    (best, d) => (d.calories > best.calories ? d : best),
    pool[0],
  );
  return cover.imageUrl ?? DEFAULT_DISH_IMAGE_URL;
}

// Phần dữ liệu thô 1 bữa cần đọc để tính dinh dưỡng (đủ dùng cho cả daily-plan
// lẫn suggest-plan; các field khác Prisma trả về dư cũng không sao).
type DailyMenuRow = {
  meal: {
    meal_id: number;
    meal_type: MealType;
    is_finished: boolean;
    meal_menus: Array<{
      quantity: number;
      dish: {
        dish_id: number;
        dish_name: string;
        image_url: string | null;
        dish_nutrients: Array<{ value: number; nutrient: { name: string } }>;
      };
    }>;
  };
};

// Dựng danh sách bữa (kèm calo/macro từng món và từng bữa) + tổng cả ngày:
// total = toàn bộ kế hoạch, completed = các bữa đã đánh dấu ăn xong.
// Dùng chung cho trang Home, template và kế hoạch gợi ý để số liệu không lệch nhau.
export function buildMealsAndSummary(dailyMenus: DailyMenuRow[]): {
  meals: MealItemDTO[];
  summary: DailyPlanSummaryDTO;
} {
  // 1. Với mỗi bữa ăn, tính ra danh sách món + tổng dinh dưỡng của bữa đó.
  const unsortedMeals: MealItemDTO[] = dailyMenus.map((dailyMenu) => {
    const meal = dailyMenu.meal;

    // Tổng dinh dưỡng của RIÊNG bữa này, cộng dồn dần khi duyệt từng món.
    let mealCalories = 0;    // return: calories
    let mealProtein = 0;     // return: protein
    let mealCarb = 0;        // return: carb
    let mealFat = 0;         // return: fat

    // Với mỗi món trong bữa: tính dinh dưỡng của món đó, đồng thời cộng vào tổng của bữa.
    const dishes: DishItemDTO[] = meal.meal_menus.map((mealMenu) => {
      // Khởi tạo Map phục vụ tra cứu chất dinh dưỡng
      const nutrientValueByName = new Map<string, number>();
      for (const dishNutrient of mealMenu.dish.dish_nutrients) {
        nutrientValueByName.set(dishNutrient.nutrient.name, dishNutrient.value);
      }
      
      // Khẩu phần
      const quantity = mealMenu.quantity;

      // Giá trị dinh dưỡng/ 100g
      const caloriesPer100g = nutrientValueByName.get(N_CAL) ?? 0;
      const proteinPer100g = nutrientValueByName.get(N_PRO) ?? 0;
      const carbPer100g = nutrientValueByName.get(N_CARB) ?? 0;
      const fatPer100g = nutrientValueByName.get(N_FAT) ?? 0;

      // Dinh dưỡng bữa ăn = giá trị trên 100g * khẩu phần (quantity).
      const dishCalories = caloriesPer100g * quantity;
      const dishProtein = proteinPer100g * quantity;
      const dishCarb = carbPer100g * quantity;
      const dishFat = fatPer100g * quantity;

      // Cộng dồn tính tổng dinh dưỡng bữa ăn
      mealCalories += dishCalories;
      mealProtein += dishProtein;
      mealCarb += dishCarb;
      mealFat += dishFat;

      return {
        dishId: mealMenu.dish.dish_id,
        name: mealMenu.dish.dish_name,
        imageUrl: mealMenu.dish.image_url,
        quantity: quantity,
        grams: Math.round(quantity * 100),
        calories: Math.round(dishCalories),
      };
    });

    return {
      mealId: meal.meal_id,
      type: meal.meal_type,
      isFinished: meal.is_finished,
      calories: round1(mealCalories),
      protein: round1(mealProtein),
      carb: round1(mealCarb),
      fat: round1(mealFat),
      coverImageUrl: pickCoverImage(dishes),
      dishes,
    };
  });

  // 2. sắp xếp các bữa theo thứ tự sáng -> trưa -> tối -> phụ.
  const meals = unsortedMeals.sort((mealA, mealB) => {
    const orderA = MEAL_ORDER[mealA.type] ?? 99;
    const orderB = MEAL_ORDER[mealB.type] ?? 99;
    return orderA - orderB;
  });

  // 3. cộng dồn dinh dưỡng của các bữa ĐÃ ĐÁNH DẤU ăn xong, cho cả ngày.
  const completedTotals = emptyTotals();
  for (const meal of meals) {
    if (meal.isFinished) {
      completedTotals.calories += meal.calories;
      completedTotals.protein += meal.protein;
      completedTotals.carb += meal.carb;
      completedTotals.fat += meal.fat;
    }
  }

  return {
    meals,
    summary: {
      completed: {
        calories: round1(completedTotals.calories),
        protein: round1(completedTotals.protein),
        carb: round1(completedTotals.carb),
        fat: round1(completedTotals.fat),
      },
    },
  };
}
