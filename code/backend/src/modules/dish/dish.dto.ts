import { NutrientUnit } from "../../../prisma/generated/prisma/client";

export type DishSearchItemDTO = {
  dishId: number;
  name: string;
  imageUrl: string | null;
  caloriesPer100g: number;
};

export type DishSearchResponseDTO = {
  items: DishSearchItemDTO[];
  total: number;
  page: number;
  pageSize: number;
};

// Tóm tắt 1 món + macro/100g. Dùng chung cho: list món cá nhân, list món global
// (admin), kết quả create/update. Không riêng "món của tôi" hay "response create".
export type DishSummaryDTO = {
  dishId: number;
  name: string;
  imageUrl: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbPer100g: number;
  fatPer100g: number;
};

export type MyDishesResponseDTO = {
  items: DishSummaryDTO[];
  total: number;
  page: number;
  pageSize: number;
};

export type MyDishNutrientDTO = {
  nutrientId: number;
  name: string;
  unit: NutrientUnit;
  value: number;
};

export type DishDetailDTO = {
  dishId: number;
  name: string;
  imageUrl: string | null;
  nutrients: MyDishNutrientDTO[];
};export type AdminGlobalDishListItemDTO = DishSummaryDTO;

export type AdminGlobalDishListResponseDTO = {
  items: AdminGlobalDishListItemDTO[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminGlobalDishDetailDTO = DishDetailDTO;