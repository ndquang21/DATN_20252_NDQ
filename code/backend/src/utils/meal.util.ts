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

// Chọn ảnh bìa cho một bữa: ưu tiên món có ảnh thật, lấy món calo cao nhất.
export function pickCoverImage(dishes: DishItemDTO[]): string {
  if (dishes.length === 0) return DEFAULT_DISH_IMAGE_URL;
  const nonDefault = dishes.filter(
    (d) => d.imageUrl && !d.imageUrl.includes("default_dish"),
  );
  const pool = nonDefault.length > 0 ? nonDefault : dishes;
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
  const meals: MealItemDTO[] = dailyMenus
    .map((dm) => {
      const meal = dm.meal;

      let mCal = 0;
      let mPro = 0;
      let mCarb = 0;
      let mFat = 0;

      const dishes: DishItemDTO[] = meal.meal_menus.map((mm) => {
        const valueByName = new Map(
          mm.dish.dish_nutrients.map((dn) => [dn.nutrient.name, dn.value]),
        );
        const q = mm.quantity;
        const cal = (valueByName.get(N_CAL) ?? 0) * q;

        mCal += cal;
        mPro += (valueByName.get(N_PRO) ?? 0) * q;
        mCarb += (valueByName.get(N_CARB) ?? 0) * q;
        mFat += (valueByName.get(N_FAT) ?? 0) * q;

        return {
          dishId: mm.dish.dish_id,
          name: mm.dish.dish_name,
          imageUrl: mm.dish.image_url,
          quantity: q,
          grams: Math.round(q * 100),
          calories: Math.round(cal),
        };
      });

      return {
        mealId: meal.meal_id,
        type: meal.meal_type,
        isFinished: meal.is_finished,
        calories: round1(mCal),
        protein: round1(mPro),
        carb: round1(mCarb),
        fat: round1(mFat),
        coverImageUrl: pickCoverImage(dishes),
        dishes,
      };
    })
    .sort((a, b) => (MEAL_ORDER[a.type] ?? 99) - (MEAL_ORDER[b.type] ?? 99));

  const completed = emptyTotals();
  for (const meal of meals) {
    if (meal.isFinished) {
      completed.calories += meal.calories;
      completed.protein += meal.protein;
      completed.carb += meal.carb;
      completed.fat += meal.fat;
    }
  }

  return {
    meals,
    summary: {
      completed: {
        calories: round1(completed.calories),
        protein: round1(completed.protein),
        carb: round1(completed.carb),
        fat: round1(completed.fat),
      },
    },
  };
}
