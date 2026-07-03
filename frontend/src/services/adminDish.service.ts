import { api } from "./api";
import type {
  AdminGlobalDishDetail,
  AdminGlobalDishListItem,
  AdminGlobalDishListResponse,
  ListAdminGlobalDishesParams,
  SaveAdminGlobalDishInput,
} from "../types/adminDish";

function toFormData(input: SaveAdminGlobalDishInput) {
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("nutrients", JSON.stringify(input.nutrients));
  if (input.imageFile) {
    formData.append("image", input.imageFile);
  }
  return formData;
}

export const adminDishService = {
  list(params: ListAdminGlobalDishesParams = {}) {
    const { search = "", page = 1, pageSize = 20 } = params;
    return api.get<AdminGlobalDishListResponse>("/dishes/global", {
      params: { search, page, pageSize },
    });
  },

  getById(dishId: number) {
    return api.get<AdminGlobalDishDetail>(`/dishes/global/${dishId}`);
  },

  create(input: SaveAdminGlobalDishInput) {
    return api.post<AdminGlobalDishListItem>(
      "/dishes/global",
      toFormData(input),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  update(dishId: number, input: SaveAdminGlobalDishInput) {
    return api.patch<AdminGlobalDishListItem>(
      `/dishes/global/${dishId}`,
      toFormData(input),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  delete(dishId: number) {
    return api.delete<{ message: string }>(`/dishes/global/${dishId}`);
  },
};
