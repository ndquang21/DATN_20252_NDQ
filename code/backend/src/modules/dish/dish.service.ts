import { Prisma, NutrientUnit } from "../../../prisma/generated/prisma/client";
import { dishRepository, pickMacroValue } from "./dish.repository";
import { nutrientRepository } from "../nutrient/nutrient.repository";
import {
  DishSummaryDTO,
  DishSearchItemDTO,
  DishSearchResponseDTO,
  MyDishesResponseDTO,
  AdminGlobalDishDetailDTO,
  AdminGlobalDishListResponseDTO,
} from "./dish.dto";
import { DishDetailDTO } from "./dish.dto";
import {
  LOCKED_MACRO_NAMES,
  NUTRIENT_NAMES,
} from "../../constants/nutrient-names";
import { DEFAULT_DISH_IMAGE_URL } from "../../constants/default-images";

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
    caloriesPer100g: Math.round(
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

async function areNutrientsValid(
  nutrients: { nutrientId: number; value: number }[],
): Promise<boolean> {
  const ids = nutrients.map((n) => n.nutrientId);
  const known = await nutrientRepository.findByIds(ids);
  if (known.length !== ids.length) return false;

  const knownNames = new Set(known.map((n) => n.name));
  for (const macro of LOCKED_MACRO_NAMES) {
    if (!knownNames.has(macro)) return false;
  }
  return true;
}

export const dishService = {
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
      items: rows.map(toDishSummary),
      total,
      page,
      pageSize,
    };
  },

  async createMyDish(
    userId: number,
    name: string,
    nutrients: { nutrientId: number; value: number }[],
    imageUrl?: string,
  ): Promise<
    | { ok: true; dish: DishSummaryDTO }
    | { ok: false; reason: "invalid_nutrients" | "duplicate_name" }
  > {
    if (!(await areNutrientsValid(nutrients))) {
      return { ok: false, reason: "invalid_nutrients" };
    }

    try {
      const created = await dishRepository.createMyDishWithNutrients({
        userId,
        name,
        imageUrl: imageUrl ?? DEFAULT_DISH_IMAGE_URL,
        nutrients,
      });
      return { ok: true, dish: toDishSummary(created) };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return { ok: false, reason: "duplicate_name" };
      }
      throw error;
    }
  },

  async getMyDishById(
    userId: number,
    dishId: number,
  ): Promise<DishDetailDTO | null> {
    const row = await dishRepository.findMyDishById(userId, dishId);
    if (!row) return null;
    return toDishDetail(row);
  },

  async updateMyDish(
    userId: number,
    dishId: number,
    name: string,
    nutrients: { nutrientId: number; value: number }[],
    imageUrl?: string,
  ): Promise<
    | { ok: true; dish: DishSummaryDTO; oldImageUrl: string | null }
    | {
        ok: false;
        reason: "not_found" | "invalid_nutrients" | "duplicate_name";
      }
  > {
    const existing = await dishRepository.findMyDishById(userId, dishId);
    if (!existing) return { ok: false, reason: "not_found" };

    if (!(await areNutrientsValid(nutrients))) {
      return { ok: false, reason: "invalid_nutrients" };
    }

    try {
      const updated = await dishRepository.updateMyDishWithNutrients({
        dishId,
        userId,
        name,
        imageUrl,
        nutrients,
      });
      if (!updated) return { ok: false, reason: "not_found" };

      return {
        ok: true,
        dish: toDishSummary(updated),
        oldImageUrl: existing.image_url,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return { ok: false, reason: "duplicate_name" };
      }
      throw error;
    }
  },

  async removeMyDish(
    userId: number,
    dishId: number,
  ): Promise<
    { ok: true; imageUrl: string | null } | { ok: false; reason: "not_found" }
  > {
    const deleted = await dishRepository.deleteMyDishWithCleanup(userId, dishId);
    if (!deleted) return { ok: false, reason: "not_found" };
    return { ok: true, imageUrl: deleted.image_url };
  },
  
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
      items: rows.map(toDishSummary),
      total,
      page,
      pageSize,
    };
  },

  async getGlobalDishById(
    dishId: number,
  ): Promise<AdminGlobalDishDetailDTO | null> {
    const row = await dishRepository.findGlobalDishById(dishId);
    if (!row) return null;
    return toDishDetail(row);
  },

  async createGlobalDish(
    adminId: number,
    name: string,
    nutrients: { nutrientId: number; value: number }[],
    imageUrl?: string,
  ): Promise<
    | { ok: true; dish: DishSummaryDTO }
    | { ok: false; reason: "invalid_nutrients" | "duplicate_name" }
  > {
    if (!(await areNutrientsValid(nutrients))) {
      return { ok: false, reason: "invalid_nutrients" };
    }

    const trimmedName = name.trim();
    if (await dishRepository.findGlobalDishByName(trimmedName)) {
      return { ok: false, reason: "duplicate_name" };
    }

    try {
      const created = await dishRepository.createGlobalDishWithNutrients({
        adminId,
        name: trimmedName,
        imageUrl: imageUrl ?? DEFAULT_DISH_IMAGE_URL,
        nutrients,
      });
      return { ok: true, dish: toDishSummary(created) };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return { ok: false, reason: "duplicate_name" };
      }
      throw error;
    }
  },

  async updateGlobalDish(
    dishId: number,
    name: string,
    nutrients: { nutrientId: number; value: number }[],
    imageUrl?: string,
  ): Promise<
    | { ok: true; dish: DishSummaryDTO; oldImageUrl: string | null }
    | {
        ok: false;
        reason: "not_found" | "invalid_nutrients" | "duplicate_name";
      }
  > {
    const existing = await dishRepository.findGlobalDishById(dishId);
    if (!existing) return { ok: false, reason: "not_found" };

    if (!(await areNutrientsValid(nutrients))) {
      return { ok: false, reason: "invalid_nutrients" };
    }

    const trimmedName = name.trim();
    if (await dishRepository.findGlobalDishByName(trimmedName, dishId)) {
      return { ok: false, reason: "duplicate_name" };
    }

    try {
      const updated = await dishRepository.updateGlobalDishWithNutrients({
        dishId,
        name: trimmedName,
        imageUrl,
        nutrients,
      });
      if (!updated) return { ok: false, reason: "not_found" };

      return {
        ok: true,
        dish: toDishSummary(updated),
        oldImageUrl: existing.image_url,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return { ok: false, reason: "duplicate_name" };
      }
      throw error;
    }
  },

  async removeGlobalDish(
    dishId: number,
  ): Promise<
    { ok: true; imageUrl: string | null } | { ok: false; reason: "not_found" }
  > {
    const deleted = await dishRepository.deleteGlobalDishWithCleanup(dishId);
    if (!deleted) return { ok: false, reason: "not_found" };
    return { ok: true, imageUrl: deleted.image_url };
  },
};
