import type { DailyPlanSummary, MealItem } from "./dailyPlan";

export type SuggestPlanDay = {
  dayIndex: number;
  dailyPlanId: number;
  isComplete: boolean;
  summary: DailyPlanSummary | null;
  meals: MealItem[];
};

export type SuggestPlanListItem = {
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

export type SuggestPlanListResponse = {
  items: SuggestPlanListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type SuggestPlanListSort =
  | "created_desc"
  | "created_asc"
  | "public_first"
  | "hidden_first";

export type ListSuggestPlansParams = {
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: SuggestPlanListSort;
};

export type CreateSuggestPlanBody = {
  name?: string;
  dayCount?: number;
};

export type CreateSuggestPlanResponse = {
  suggestPlanId: number;
};

export type SuggestPlanDetail = {
  suggestPlanId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  dayCount: number;
  completeDayCount: number;
  isPublic: boolean;
  canPublish: boolean;
  days: SuggestPlanDay[];
  createdAt: string;
  updatedAt: string;
};

export type UpdateSuggestPlanBody = {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
};

export type PublishSuggestPlanBody = {
  isPublic: boolean;
};

export type PublishSuggestPlanResponse = {
  suggestPlanId: number;
  isPublic: boolean;
  canPublish: boolean;
};

export type AddSuggestPlanDayResponse = {
  dayIndex: number;
  dailyPlanId: number;
  dayCount: number;
  day: SuggestPlanDay;
};

export type RemoveSuggestPlanDayResponse = {
  dayCount: number;
  deletedDayIndex: number;
  plan: SuggestPlanDetail;
};

export type SuggestPlanDayNutrients = {
  dayIndex: number;
  dailyPlanId: number;
  totals: import("./dailyPlan").NutrientValue[];
};export type SuggestPlanPublicListItem = {
  suggestPlanId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  dayCount: number;
};

export type SuggestPlanPublicListResponse = {
  items: SuggestPlanPublicListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type SuggestPlanPublicDay = {
  dayIndex: number;
  isComplete: boolean;
  summary: DailyPlanSummary | null;
  meals: MealItem[];
};

export type SuggestPlanPublicDetail = {
  suggestPlanId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  dayCount: number;
  days: SuggestPlanPublicDay[];
};

export type ListPublicSuggestPlansParams = {
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: "created_desc" | "created_asc";
};

export type ApplySuggestPlanBody =
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

export type ApplySuggestPlanResponse = {
  affectedDates: string[];
  plans: import("./dailyPlan").DailyPlanResponse[];
};

export type ApplySuggestPlanScope =
  | { kind: "plan"; suggestPlanId: number }
  | { kind: "day"; suggestPlanId: number; sourceDayIndex: number }
  | { kind: "meal"; suggestPlanId: number; sourceMealId: number };