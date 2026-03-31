import type { MyDishDetail, MyDishItem } from "./dish";export type AdminGlobalDishListItem = MyDishItem;

export type AdminGlobalDishListResponse = {
  items: AdminGlobalDishListItem[];
  total: number;
  page: number;
  pageSize: number;
};export type AdminGlobalDishDetail = MyDishDetail;

export type ListAdminGlobalDishesParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type SaveAdminGlobalDishInput = {
  name: string;
  imageFile?: File | null;
  nutrients: { nutrientId: number; value: number }[];
};
