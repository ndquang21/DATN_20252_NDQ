import type { NutrientUnit } from "./nutrient";

export type TrackedNutrientSlot = {
  sortOrder: number;
  nutrientId: number;
  name: string;
  unit: NutrientUnit;
};

export type TrackedNutrientsResponse = {
  slots: TrackedNutrientSlot[];
};

export type UpdateTrackedNutrientsPayload = {
  slots: { sortOrder: number; nutrientId: number }[];
};
