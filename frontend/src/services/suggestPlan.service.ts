import { api } from "./api";
import type {
  AddSuggestPlanDayResponse,
  ApplySuggestPlanBody,
  ApplySuggestPlanResponse,
  CreateSuggestPlanBody,
  CreateSuggestPlanResponse,
  ListPublicSuggestPlansParams,
  ListSuggestPlansParams,
  PublishSuggestPlanBody,
  PublishSuggestPlanResponse,
  RemoveSuggestPlanDayResponse,
  SuggestPlanDetail,
  SuggestPlanListResponse,
  SuggestPlanPublicDetail,
  SuggestPlanPublicListResponse,
  SuggestPlanDayNutrients,
  UpdateSuggestPlanBody,
} from "../types/suggestPlan";
import type { MealNutrients } from "../types/dailyPlan";

export const suggestPlanService = {
  list(params: ListSuggestPlansParams = {}) {
    const {
      search = "",
      page = 1,
      pageSize = 20,
      sort = "created_desc",
    } = params;
    return api.get<SuggestPlanListResponse>("/suggest-plans", {
      params: { search, page, pageSize, sort },
    });
  },

  create(body: CreateSuggestPlanBody = {}) {
    return api.post<CreateSuggestPlanResponse>("/suggest-plans", body);
  },

  getById(suggestPlanId: number) {
    return api.get<SuggestPlanDetail>(`/suggest-plans/${suggestPlanId}`);
  },

  update(suggestPlanId: number, body: UpdateSuggestPlanBody) {
    return api.patch<SuggestPlanDetail>(
      `/suggest-plans/${suggestPlanId}`,
      body,
    );
  },

  uploadCover(suggestPlanId: number, imageFile: File) {
    const formData = new FormData();
    formData.append("image", imageFile);
    return api.patch<SuggestPlanDetail>(
      `/suggest-plans/${suggestPlanId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  delete(suggestPlanId: number) {
    return api.delete<{ message: string }>(`/suggest-plans/${suggestPlanId}`);
  },

  publish(suggestPlanId: number, body: PublishSuggestPlanBody) {
    return api.patch<PublishSuggestPlanResponse>(
      `/suggest-plans/${suggestPlanId}/publish`,
      body,
    );
  },

  addDay(suggestPlanId: number) {
    return api.post<AddSuggestPlanDayResponse>(
      `/suggest-plans/${suggestPlanId}/days`,
    );
  },

  deleteDay(suggestPlanId: number, dayIndex: number) {
    return api.delete<RemoveSuggestPlanDayResponse>(
      `/suggest-plans/${suggestPlanId}/days/${dayIndex}`,
    );
  },

  getDayNutrients(suggestPlanId: number, dayIndex: number) {
    return api.get<SuggestPlanDayNutrients>(
      `/suggest-plans/${suggestPlanId}/days/${dayIndex}/nutrients`,
    );
  },  listPublic(params: ListPublicSuggestPlansParams = {}) {
    const { search = "", page = 1, pageSize = 20, sort = "created_desc" } =
      params;
    return api.get<SuggestPlanPublicListResponse>("/suggest-plans/public", {
      params: { search, page, pageSize, sort },
    });
  },

  getPublicById(suggestPlanId: number) {
    return api.get<SuggestPlanPublicDetail>(
      `/suggest-plans/public/${suggestPlanId}`,
    );
  },

  getPublicMealNutrients(mealId: number) {
    return api.get<MealNutrients>(
      `/suggest-plans/public/meals/${mealId}/nutrients`,
    );
  },

  applyPublic(suggestPlanId: number, body: ApplySuggestPlanBody) {
    return api.post<ApplySuggestPlanResponse>(
      `/suggest-plans/public/${suggestPlanId}/apply`,
      body,
    );
  },
};
