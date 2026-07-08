import type {
  DailyPlanSummaryDTO,
  MealItemDTO,
  NutrientValueDTO,
} from "../daily-plan/daily-plan.dto";

// ===== Admin: quản lý gói gợi ý =====

// 1 ngày trong gói (bữa + dinh dưỡng, tái dùng cấu trúc Daily Plan)
export type SuggestPlanDayDTO = {
  dayIndex: number;
  dailyPlanId: number;
  isComplete: boolean;
  summary: DailyPlanSummaryDTO | null;
  meals: MealItemDTO[];
};

// 1 dòng trong danh sách gói (cho admin)
export type SuggestPlanListItemDTO = {
  suggestPlanId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  dayCount: number;
  completeDayCount: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

// Danh sách gói kèm phân trang (cho admin)
export type SuggestPlanListResponseDTO = {
  items: SuggestPlanListItemDTO[];
  total: number;
  page: number;
  pageSize: number;
};

// Kết quả tạo gói mới
export type CreateSuggestPlanResponseDTO = {
  suggestPlanId: number;
};

// Chi tiết đầy đủ 1 gói, gồm mọi ngày (cho admin)
export type SuggestPlanDetailDTO = {
  suggestPlanId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  dayCount: number;
  completeDayCount: number;
  isPublic: boolean;
  canPublish: boolean;
  days: SuggestPlanDayDTO[];
  createdAt: string;
  updatedAt: string;
};

// Body sửa tên/mô tả/ảnh gói
export type UpdateSuggestPlanBodyDTO = {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
};

// Kết quả bật/tắt công khai
export type PublishSuggestPlanResponseDTO = {
  suggestPlanId: number;
  isPublic: boolean;
  canPublish: boolean;
};

// Kết quả thêm 1 ngày mới vào gói
export type AddSuggestPlanDayResponseDTO = {
  dayIndex: number;
  dailyPlanId: number;
  dayCount: number;
  day: SuggestPlanDayDTO;
};

// Kết quả xóa 1 ngày khỏi gói
export type RemoveSuggestPlanDayResponseDTO = {
  dayCount: number;
  deletedDayIndex: number;
  plan: SuggestPlanDetailDTO;
};

// Dinh dưỡng đầy đủ (mọi chất) của 1 ngày trong gói
export type SuggestPlanDayNutrientsDTO = {
  dayIndex: number;
  dailyPlanId: number;
  totals: NutrientValueDTO[];
};

// ===== Public: user xem gói đang công khai =====

// 1 dòng trong danh sách gói công khai (ít trường hơn bản admin)
export type SuggestPlanPublicListItemDTO = {
  suggestPlanId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  dayCount: number;
};

// Danh sách gói công khai kèm phân trang
export type SuggestPlanPublicListResponseDTO = {
  items: SuggestPlanPublicListItemDTO[];
  total: number;
  page: number;
  pageSize: number;
};

// 1 ngày trong gói công khai (không có dailyPlanId, ẩn chi tiết quản trị)
export type SuggestPlanPublicDayDTO = {
  dayIndex: number;
  isComplete: boolean;
  summary: DailyPlanSummaryDTO | null;
  meals: MealItemDTO[];
};

// Chi tiết 1 gói công khai (cho user xem trước khi áp dụng)
export type SuggestPlanPublicDetailDTO = {
  suggestPlanId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  dayCount: number;
  days: SuggestPlanPublicDayDTO[];
};

// ===== Apply: áp dụng gói vào ngày thật của user =====

// Body áp dụng: cả gói / 1 ngày / 1 bữa, tùy "scope"
export type ApplySuggestPlanBodyDTO =
  | {
      scope: "plan";
      startDate: string;
    }
  | {
      scope: "day";
      sourceDayIndex: number;
      targetDate: string;
    }
  | {
      scope: "meal";
      sourceMealId: number;
      targetDate: string;
      targetMealType: "breakfast" | "lunch" | "dinner" | "snack";
    };

// Kết quả áp dụng: những ngày bị ảnh hưởng + plan mới nhất
export type ApplySuggestPlanResponseDTO = {
  affectedDates: string[];
  plans: import("../daily-plan/daily-plan.dto").DailyPlanResponseDTO[];
};
