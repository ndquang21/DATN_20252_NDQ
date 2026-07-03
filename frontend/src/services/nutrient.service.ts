import { api } from "./api";
import type {
  CreateNutrientPayload,
  NutrientItem,
  NutrientListResponse,
  UpdateNutrientPayload,
} from "../types/nutrient";

export const nutrientService = {
  list() {
    return api.get<NutrientListResponse>("/nutrients");
  },

  create(payload: CreateNutrientPayload) {
    return api.post<NutrientItem>("/nutrients", payload);
  },

  update(nutrientId: number, payload: UpdateNutrientPayload) {
    return api.patch<NutrientItem>(`/nutrients/${nutrientId}`, payload);
  },

  delete(nutrientId: number) {
    return api.delete<NutrientItem>(`/nutrients/${nutrientId}`);
  },
};
