import { NutrientUnit } from "../../../prisma/generated/prisma/client";
import { dishRepository } from "./dish.repository";
import { nutrientRepository } from "../nutrient/nutrient.repository";
import {
  DishSummaryDTO,
  DishSearchItemDTO,
  DishSearchResponseDTO,
  MyDishesResponseDTO,
  AdminGlobalDishDetailDTO,
  AdminGlobalDishListResponseDTO,
  DishDetailDTO
} from "./dish.dto";
import {
  LOCKED_MACRO_NAMES,
  NUTRIENT_NAMES,
} from "../../constants/nutrient-names";
import { DEFAULT_DISH_IMAGE_URL } from "../../constants/default-images";
import { appError } from "../../utils/http.util";


// Tra giá trị 1 chất theo tên trong mảng dinh dưỡng
function pickMacroValue(
  rows: { value: number; nutrient: { name: string } }[],
  name: string,
): number {
  // Tìm trong "rows" 1 phần tử có tên chất khớp với "name"
  const matchedRow = rows.find((row) => {
    return row.nutrient.name === name;
  });

  // Tìm thấy thì lấy giá trị; không thấy (món không khai chất này) thì coi
  // giá trị trên 100g là 0
  if (matchedRow === undefined) {
    return 0;
  }
  return matchedRow.value;
}

// Rút gọn món kèm dinh dưỡng chính
function toDishSummary(d: {
  dish_id: number;
  dish_name: string;
  image_url: string | null;
  dish_nutrients: { value: number; nutrient: { name: string } }[];
}): DishSummaryDTO {
  const dn = d.dish_nutrients;
  return {
    dishId: d.dish_id,
    name: d.dish_name,
    imageUrl: d.image_url,
    caloriesPer100g: 
    Math.round(
      pickMacroValue(dn, NUTRIENT_NAMES.CALORIES),
    ),
    proteinPer100g:
      Math.round(
        pickMacroValue(dn, NUTRIENT_NAMES.PROTEIN) * 10,
      ) / 10,
    carbPer100g:
      Math.round(
        pickMacroValue(dn, NUTRIENT_NAMES.CARBOHYDRATE) *
          10,
      ) / 10,
    fatPer100g:
      Math.round(
        pickMacroValue(dn, NUTRIENT_NAMES.FAT) * 10,
      ) / 10,
  };
}

// Map 1 món (kèm đầy đủ chất dinh dưỡng) sang DTO chi tiết.
// Dùng chung cho cả món cá nhân (getMyDishById) và món hệ thống (getGlobalDishById).
function toDishDetail(row: {
  dish_id: number;
  dish_name: string;
  image_url: string | null;
  dish_nutrients: {
    value: number;
    nutrient: { nutrient_id: number; name: string; unit: NutrientUnit };
  }[];
}): DishDetailDTO {
  return {
    dishId: row.dish_id,
    name: row.dish_name,
    imageUrl: row.image_url,
    nutrients: row.dish_nutrients.map((dn) => ({
      nutrientId: dn.nutrient.nutrient_id,
      name: dn.nutrient.name,
      unit: dn.nutrient.unit,
      value: dn.value,
    })),
  };
}

// Kiểm tra id chất có tồn tại và đủ 4 macro bắt buộc k
async function areNutrientsValid(
  nutrients: { nutrientId: number; value: number }[],
): Promise<boolean> {
  const ids = nutrients.map((n) => n.nutrientId); // lấy ra danh sách chất được gửi lên
  const known = await nutrientRepository.findByIds(ids); // tra DB xem những chất này có tồn tại
  if (known.length !== ids.length) return false; // thiếu 1 chất nào đó -> không hợp lệ

  // Phải có đủ 4 macro bắt buộc
  const knownNames = new Set(known.map((n) => n.name)); // Tên các chất đã gửi lên
  for (const macro of LOCKED_MACRO_NAMES) {
    if (!knownNames.has(macro)) return false;
  }
  return true;
}

export const dishService = {
  // Tìm món (user tìm cả món hệ thống lẫn món riêng)
  async search(
    userId: number,
    search: string,
    page: number,
    pageSize: number,
  ): Promise<DishSearchResponseDTO> {
    const skip = (page - 1) * pageSize;

    const [rows, total] = await Promise.all([
      dishRepository.searchDishes(userId, search, skip, pageSize),
      dishRepository.countDishes(userId, search),
    ]);

    const items: DishSearchItemDTO[] = rows.map((d) => ({
      dishId: d.dish_id,
      name: d.dish_name,
      imageUrl: d.image_url,
      caloriesPer100g: Math.round(d.dish_nutrients[0]?.value ?? 0),
    }));

    return { items, total, page, pageSize };
  },


  // Danh sách món cá nhân của user
  async listMyDishes(
    userId: number,
    page: number,
    pageSize: number,
  ): Promise<MyDishesResponseDTO> {
    const skip = (page - 1) * pageSize;

    const [rows, total] = await Promise.all([
      dishRepository.listMyDishes(userId, skip, pageSize),
      dishRepository.countMyDishes(userId),
    ]);

    return {
      items: rows.map((row) => {
        return toDishSummary(row);
      }),
      total,
      page,
      pageSize,
    };
  },


  // Tạo món cá nhân
  async createMyDish(
    userId: number,
    name: string,
    nutrients: { nutrientId: number; value: number }[],
    imageUrl?: string,
  ): Promise<DishSummaryDTO> {
    if (!(await areNutrientsValid(nutrients))) {
      throw appError(
        "Chất dinh dưỡng không hợp lệ hoặc thiếu macro bắt buộc.",
        400,
      );
    }

    const trimmedName = name.trim();
    if (await dishRepository.findMyDishByName(userId, trimmedName)) {
      throw appError("Bạn đã có món trùng tên. Vui lòng đặt tên khác.", 409);
    }

    const created = await dishRepository.createMyDishWithNutrients({
      userId,
      name: trimmedName,
      imageUrl: imageUrl ?? DEFAULT_DISH_IMAGE_URL,
      nutrients,
    });
    return toDishSummary(created);
  },


  // Xem chi tiết 1 món cá nhân
  async getMyDishById(
    userId: number,
    dishId: number,
  ): Promise<DishDetailDTO | null> {
    const row = await dishRepository.findMyDishById(userId, dishId);
    if (!row) return null;
    return toDishDetail(row);
  },


  // Sửa món cá nhân
  async updateMyDish(
    userId: number,
    dishId: number,
    name: string,
    nutrients: { nutrientId: number; value: number }[],
    imageUrl?: string,
  ): Promise<{ dish: DishSummaryDTO; oldImageUrl: string | null }> {
    const existing = await dishRepository.findMyDishById(userId, dishId);
    if (!existing) throw appError("Không tìm thấy món của bạn", 404);

    if (!(await areNutrientsValid(nutrients))) {
      throw appError(
        "Chất dinh dưỡng không hợp lệ hoặc thiếu macro bắt buộc.",
        400,
      );
    }

    const trimmedName = name.trim();
    if (await dishRepository.findMyDishByName(userId, trimmedName, dishId)) {
      throw appError("Bạn đã có món trùng tên. Vui lòng đặt tên khác.", 409);
    }

    const updated = await dishRepository.updateMyDishWithNutrients({
      dishId,
      userId,
      name: trimmedName,
      imageUrl,
      nutrients,
    });
    if (!updated) throw appError("Không tìm thấy món của bạn", 404);

    return { dish: toDishSummary(updated), oldImageUrl: existing.image_url };
  },


  // Xóa món cá nhân
  async removeMyDish(
    userId: number,
    dishId: number,
  ): Promise<{ imageUrl: string | null }> {
    const deleted = await dishRepository.deleteMyDishWithCleanup(userId, dishId);
    if (!deleted) throw appError("Không tìm thấy món của bạn", 404);
    return { imageUrl: deleted.image_url };
  },


  // (Admin) danh sách món hệ thống
  async listGlobalDishes(
    search: string,
    page: number,
    pageSize: number,
  ): Promise<AdminGlobalDishListResponseDTO> {
    const skip = (page - 1) * pageSize;
    const [rows, total] = await Promise.all([
      dishRepository.listGlobalDishes(search, skip, pageSize),
      dishRepository.countGlobalDishes(search),
    ]);
    return {
      items: rows.map((row) => {
        return toDishSummary(row);
      }),
      total,
      page,
      pageSize,
    };
  },


  // (Admin) xem chi tiết món hệ thống
  async getGlobalDishById(
    dishId: number,
  ): Promise<AdminGlobalDishDetailDTO | null> {
    const row = await dishRepository.findGlobalDishById(dishId);
    if (!row) return null;
    return toDishDetail(row);
  },


  // (Admin) tạo món hệ thống
  async createGlobalDish(
    adminId: number,
    name: string,
    nutrients: { nutrientId: number; value: number }[],
    imageUrl?: string,
  ): Promise<DishSummaryDTO> {
    if (!(await areNutrientsValid(nutrients))) {
      throw appError(
        "Chất dinh dưỡng không hợp lệ hoặc thiếu macro bắt buộc.",
        400,
      );
    }

    const trimmedName = name.trim();
    if (await dishRepository.findGlobalDishByName(trimmedName)) {
      throw appError(
        "Đã có món hệ thống trùng tên. Vui lòng đặt tên khác.",
        409,
      );
    }

    const created = await dishRepository.createGlobalDishWithNutrients({
      adminId,
      name: trimmedName,
      imageUrl: imageUrl ?? DEFAULT_DISH_IMAGE_URL,
      nutrients,
    });
    return toDishSummary(created);
  },


  // (Admin) sửa món hệ thống
  async updateGlobalDish(
    dishId: number,
    name: string,
    nutrients: { nutrientId: number; value: number }[],
    imageUrl?: string,
  ): Promise<{ dish: DishSummaryDTO; oldImageUrl: string | null }> {
    const existing = await dishRepository.findGlobalDishById(dishId);
    if (!existing) throw appError("Không tìm thấy món hệ thống", 404);

    if (!(await areNutrientsValid(nutrients))) {
      throw appError(
        "Chất dinh dưỡng không hợp lệ hoặc thiếu macro bắt buộc.",
        400,
      );
    }

    const trimmedName = name.trim();
    if (await dishRepository.findGlobalDishByName(trimmedName, dishId)) {
      throw appError(
        "Đã có món hệ thống trùng tên. Vui lòng đặt tên khác.",
        409,
      );
    }

    const updated = await dishRepository.updateGlobalDishWithNutrients({
      dishId,
      name: trimmedName,
      imageUrl,
      nutrients,
    });
    if (!updated) throw appError("Không tìm thấy món hệ thống", 404);

    return { dish: toDishSummary(updated), oldImageUrl: existing.image_url };
  },


  // (Admin) xóa món hệ thống
  async removeGlobalDish(
    dishId: number,
  ): Promise<{ imageUrl: string | null }> {
    const deleted = await dishRepository.deleteGlobalDishWithCleanup(dishId);
    if (!deleted) throw appError("Không tìm thấy món hệ thống", 404);
    return { imageUrl: deleted.image_url };
  },
};