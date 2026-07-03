import type { NutrientUnit } from "./nutrient";

export type DishSearchItem = {
  dishId: number;
  name: string;
  imageUrl: string | null;
  caloriesPer100g: number;
};

export type DishSearchResponse = {
  items: DishSearchItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type MyDishItem = {
  dishId: number;
  name: string;
  imageUrl: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbPer100g: number;
  fatPer100g: number;
};

export type MyDishesResponse = {
  items: MyDishItem[];
  total: number;
  page: number;
  pageSize: number;
};


export type MyDishNutrient = {
  nutrientId: number;
  name: string;
  unit: NutrientUnit;
  value: number;
};

export type MyDishDetail = {
  dishId: number;
  name: string;
  imageUrl: string | null;
  nutrients: MyDishNutrient[];
};