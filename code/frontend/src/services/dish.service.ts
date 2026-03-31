import { api } from "./api";
import type {
  DishSearchResponse,
  MyDishItem,
  MyDishesResponse,
} from "../types/dish";
import type { MyDishDetail } from "../types/dish";

export const dishService = {
  searchDishes(search: string, page = 1, pageSize = 20) {
    return api.get<DishSearchResponse>("/dishes", {
      params: { search, page, pageSize },
    });
  },

  listMyDishes(page = 1, pageSize = 50) {
    return api.get<MyDishesResponse>("/dishes/mine", {
      params: { page, pageSize },
    });
  },

  createDish(input: {
    name: string;
    imageFile?: File | null;
    nutrients: { nutrientId: number; value: number }[];
  }) {
    const formData = new FormData();
    formData.append("name", input.name);
    formData.append("nutrients", JSON.stringify(input.nutrients));
    if (input.imageFile) {
      formData.append("image", input.imageFile);
    }

    return api.post<MyDishItem>("/dishes", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getMyDish(dishId: number) {
    return api.get<MyDishDetail>(`/dishes/mine/${dishId}`);
  },
  updateDish(
    dishId: number,
    input: {
      name: string;
      imageFile?: File | null;
      nutrients: { nutrientId: number; value: number }[];
    },
  ) {
    const formData = new FormData();
    formData.append("name", input.name);
    formData.append("nutrients", JSON.stringify(input.nutrients));
    if (input.imageFile) {
      formData.append("image", input.imageFile);
    }
    return api.patch<MyDishItem>(`/dishes/${dishId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteDish(dishId: number) {
    return api.delete<{ message: string }>(`/dishes/${dishId}`);
  },
};