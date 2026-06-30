import { api } from "./api";
import type {
  DailyPlanResponse,
  MealNutrients,
  MealType,
  CreateMealResponse,
  CreateMealInput,
} from "../types/dailyPlan";

export const dailyPlanService = {
  getDailyPlan(date: string) {
    return api.get<DailyPlanResponse>("/daily-plans", { params: { date } });
  },

  getMealNutrients(mealId: number) {
    return api.get<MealNutrients>(`/daily-plans/meals/${mealId}/nutrients`);
  },

  finishMeal(mealId: number, isFinished: boolean) {
    return api.patch(`/daily-plans/meals/${mealId}/finish`, { isFinished });
  },  createMeal(input: CreateMealInput) {
    return api.post<CreateMealResponse>("/daily-plans/meals", input);
  },

  addDish(mealId: number, dishId: number, grams: number) {
    return api.post<DailyPlanResponse>(`/daily-plans/meals/${mealId}/dishes`, {
      dishId,
      grams,
    });
  },

  updateDish(mealId: number, dishId: number, grams: number) {
    return api.patch<DailyPlanResponse>(
      `/daily-plans/meals/${mealId}/dishes/${dishId}`,
      { grams },
    );
  },

  removeDish(mealId: number, dishId: number) {
    return api.delete<DailyPlanResponse>(
      `/daily-plans/meals/${mealId}/dishes/${dishId}`,
    );
  },
};