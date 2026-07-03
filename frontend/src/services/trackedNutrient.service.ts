import { api } from "./api";
import type {
  TrackedNutrientsResponse,
  UpdateTrackedNutrientsPayload,
} from "../types/trackedNutrient";

export const trackedNutrientService = {
  getMine() {
    return api.get<TrackedNutrientsResponse>("/users/me/tracked-nutrients");
  },

  updateMine(payload: UpdateTrackedNutrientsPayload) {
    return api.put<TrackedNutrientsResponse>(
      "/users/me/tracked-nutrients",
      payload,
    );
  },
};
