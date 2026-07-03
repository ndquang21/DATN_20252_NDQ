import type {
    DailyPlanSummaryDTO,
    MealItemDTO,
    NutrientValueDTO,
  } from "../daily-plan/daily-plan.dto";
  
  export type SuggestPlanDayDTO = {
    dayIndex: number;
    dailyPlanId: number;
    isComplete: boolean;
    summary: DailyPlanSummaryDTO | null;
    meals: MealItemDTO[];
  };
  
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
  
  export type SuggestPlanListResponseDTO = {
    items: SuggestPlanListItemDTO[];
    total: number;
    page: number;
    pageSize: number;
  };
  
  export type CreateSuggestPlanBodyDTO = {
    name?: string;
    dayCount?: number;
  };
  
  export type CreateSuggestPlanResponseDTO = {
    suggestPlanId: number;
  };
  
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
  
  export type UpdateSuggestPlanBodyDTO = {
    name?: string;
    description?: string | null;
    imageUrl?: string | null;
  };
  
  export type PublishSuggestPlanBodyDTO = {
    isPublic: boolean;
  };
  
  export type PublishSuggestPlanResponseDTO = {
    suggestPlanId: number;
    isPublic: boolean;
    canPublish: boolean;
  };
  
  export type AddSuggestPlanDayResponseDTO = {
    dayIndex: number;
    dailyPlanId: number;
    dayCount: number;
    day: SuggestPlanDayDTO;
  };
  
  export type RemoveSuggestPlanDayResponseDTO = {
    dayCount: number;
    deletedDayIndex: number;
    plan: SuggestPlanDetailDTO;
  };

  export type SuggestPlanDayNutrientsDTO = {
    dayIndex: number;
    dailyPlanId: number;
    totals: NutrientValueDTO[];
  };

export type SuggestPlanPublicListItemDTO = {
  suggestPlanId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  dayCount: number;
};

export type SuggestPlanPublicListResponseDTO = {
  items: SuggestPlanPublicListItemDTO[];
  total: number;
  page: number;
  pageSize: number;
};

export type SuggestPlanPublicDayDTO = {
  dayIndex: number;
  isComplete: boolean;
  summary: DailyPlanSummaryDTO | null;
  meals: MealItemDTO[];
};

export type SuggestPlanPublicDetailDTO = {
  suggestPlanId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  dayCount: number;
  days: SuggestPlanPublicDayDTO[];
};

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

export type ApplySuggestPlanResponseDTO = {
  affectedDates: string[];
  plans: import("../daily-plan/daily-plan.dto").DailyPlanResponseDTO[];
};