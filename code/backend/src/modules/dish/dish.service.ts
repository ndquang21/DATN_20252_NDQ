import { Prisma } from "../../../prisma/generated/prisma/client";
import { dishRepository, dishRepositoryHelpers } from "./dish.repository";
import { nutrientRepository } from "../nutrient/nutrient.repository";
import {
  CreateDishResponseDTO,
  DishSearchItemDTO,
  DishSearchResponseDTO,
  MyDishesResponseDTO,
  AdminGlobalDishDetailDTO,
  AdminGlobalDishListResponseDTO,
} from "./dish.dto";
import { MyDishDetailDTO } from "./dish.dto";
import {
  LOCKED_MACRO_NAMES,
  NUTRIENT_NAMES,
} from "../../constants/nutrient-names";
import { DEFAULT_DISH_IMAGE_URL } from "../../constants/default-images";

const REQUIRED_MACRO_NAMES = LOCKED_MACRO_NAMES;

const DEFAULT_DISH_IMAGE = DEFAULT_DISH_IMAGE_URL;

function toMyDishItem(d: {
  dish_id: number;
  dish_name: string;
  image_url: string | null;
  dish_nutrients: { value: number; nutrient: { name: string } }[];
}): CreateDishResponseDTO {
  const dn = d.dish_nutrients;
  return {
    dishId: d.dish_id,
    name: d.dish_name,
    imageUrl: d.image_url,
    caloriesPer100g: Math.round(
      dishRepositoryHelpers.pickMacroValue(dn, NUTRIENT_NAMES.CALORIES),
    ),
    proteinPer100g:
      Math.round(
        dishRepositoryHelpers.pickMacroValue(dn, NUTRIENT_NAMES.PROTEIN) * 10,
      ) / 10,
    carbPer100g:
      Math.round(
        dishRepositoryHelpers.pickMacroValue(dn, NUTRIENT_NAMES.CARBOHYDRATE) *
          10,
      ) / 10,
    fatPer100g:
      Math.round(
        dishRepositoryHelpers.pickMacroValue(dn, NUTRIENT_NAMES.FAT) * 10,
      ) / 10,
  };
}

function toGlobalDishDetail(row: {
  dish_id: number;
  dish_name: string;
  image_url: string | null;
  dish_nutrients: {
    value: number;
    nutrient: { nutrient_id: number; name: string; unit: string };
  }[];
}): AdminGlobalDishDetailDTO {
  return {
    dishId: row.dish_id,
    name: row.dish_name,
    imageUrl: row.image_url,
    nutrients: row.dish_nutrients.map((dn) => ({
      nutrientId: dn.nutrient.nutrient_id,
      name: dn.nutrient.name,
      unit: dn.nutrient
        .unit as AdminGlobalDishDetailDTO["nutrients"][number]["unit"],
      value: dn.value,
    })),
  };
}

async function assertValidNutrients(
  nutrients: { nutrientId: number; value: number }[],
): Promise<boolean> {
  const ids = nutrients.map((n) => n.nutrientId);
  const known = await nutrientRepository.findByIds(ids);
  if (known.length !== ids.length) return false;

  const knownNames = new Set(known.map((n) => n.name));
  for (const macro of REQUIRED_MACRO_NAMES) {
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
      dishRepository.search(userId, search, skip, pageSize),
      dishRepository.count(userId, search),
    ]);

    const items: DishSearchItemDTO[] = rows.map((d) => ({
      dishId: d.dish_id,
      name: d.dish_name,
      imageUrl: d.image_url,
      caloriesPer100g: Math.round(d.dish_nutrients[0]?.value ?? 0),
    }));

    return { items, total, page, pageSize };
  },

  async listMine(
    userId: number,
    page: number,
    pageSize: number,
  ): Promise<MyDishesResponseDTO> {
    const skip = (page - 1) * pageSize;

    const [rows, total] = await Promise.all([
      dishRepository.findMine(userId, skip, pageSize),
      dishRepository.countMine(userId),
    ]);

    return {
      items: rows.map(toMyDishItem),
      total,
      page,
      pageSize,
    };
  },

  async create(
    userId: number,
    name: string,
    nutrients: { nutrientId: number; value: number }[],
    imageUrl?: string,
  ): Promise<
    | { ok: true; dish: CreateDishResponseDTO }
    | { ok: false; reason: "invalid_nutrients" | "duplicate_name" }
  > {
    const ids = nutrients.map((n) => n.nutrientId);
    const known = await nutrientRepository.findByIds(ids);
    if (known.length !== ids.length) {
      return { ok: false, reason: "invalid_nutrients" };
    }

    const knownNames = new Set(known.map((n) => n.name));
    for (const macro of REQUIRED_MACRO_NAMES) {
      if (!knownNames.has(macro)) {
        return { ok: false, reason: "invalid_nutrients" };
      }
    }

    try {
      const created = await dishRepository.createWithNutrients({
        userId,
        name,
        imageUrl: imageUrl ?? DEFAULT_DISH_IMAGE,
        nutrients,
      });
      return { ok: true, dish: toMyDishItem(created) };
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

  async getMineById(
    userId: number,
    dishId: number,
  ): Promise<MyDishDetailDTO | null> {
    const row = await dishRepository.findMineById(userId, dishId);
    if (!row) return null;

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
  },

  async update(
    userId: number,
    dishId: number,
    name: string,
    nutrients: { nutrientId: number; value: number }[],
    imageUrl?: string,
  ): Promise<
    | { ok: true; dish: CreateDishResponseDTO; oldImageUrl: string | null }
    | {
        ok: false;
        reason: "not_found" | "invalid_nutrients" | "duplicate_name";
      }
  > {
    const existing = await dishRepository.findMineById(userId, dishId);
    if (!existing) return { ok: false, reason: "not_found" };

    if (!(await assertValidNutrients(nutrients))) {
      return { ok: false, reason: "invalid_nutrients" };
    }

    try {
      const updated = await dishRepository.updateWithNutrients({
        dishId,
        userId,
        name,
        imageUrl,
        nutrients,
      });
      if (!updated) return { ok: false, reason: "not_found" };

      return {
        ok: true,
        dish: toMyDishItem(updated),
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

  async remove(
    userId: number,
    dishId: number,
  ): Promise<
    { ok: true; imageUrl: string | null } | { ok: false; reason: "not_found" }
  > {
    const deleted = await dishRepository.deleteOwnedWithCleanup(userId, dishId);
    if (!deleted) return { ok: false, reason: "not_found" };
    return { ok: true, imageUrl: deleted.image_url };
  },
  async listGlobalForAdmin(
    search: string,
    page: number,
    pageSize: number,
  ): Promise<AdminGlobalDishListResponseDTO> {
    const skip = (page - 1) * pageSize;
    const [rows, total] = await Promise.all([
      dishRepository.listGlobal(search, skip, pageSize),
      dishRepository.countGlobal(search),
    ]);
    return {
      items: rows.map(toMyDishItem),
      total,
      page,
      pageSize,
    };
  },

  async getGlobalById(
    dishId: number,
  ): Promise<AdminGlobalDishDetailDTO | null> {
    const row = await dishRepository.findGlobalById(dishId);
    if (!row) return null;
    return toGlobalDishDetail(row);
  },

  async createGlobal(
    adminId: number,
    name: string,
    nutrients: { nutrientId: number; value: number }[],
    imageUrl?: string,
  ): Promise<
    | { ok: true; dish: CreateDishResponseDTO }
    | { ok: false; reason: "invalid_nutrients" | "duplicate_name" }
  > {
    if (!(await assertValidNutrients(nutrients))) {
      return { ok: false, reason: "invalid_nutrients" };
    }

    const trimmedName = name.trim();
    if (await dishRepository.findGlobalByName(trimmedName)) {
      return { ok: false, reason: "duplicate_name" };
    }

    try {
      const created = await dishRepository.createGlobalWithNutrients({
        adminId,
        name: trimmedName,
        imageUrl: imageUrl ?? DEFAULT_DISH_IMAGE,
        nutrients,
      });
      return { ok: true, dish: toMyDishItem(created) };
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

  async updateGlobal(
    dishId: number,
    name: string,
    nutrients: { nutrientId: number; value: number }[],
    imageUrl?: string,
  ): Promise<
    | { ok: true; dish: CreateDishResponseDTO; oldImageUrl: string | null }
    | {
        ok: false;
        reason: "not_found" | "invalid_nutrients" | "duplicate_name";
      }
  > {
    const existing = await dishRepository.findGlobalById(dishId);
    if (!existing) return { ok: false, reason: "not_found" };

    if (!(await assertValidNutrients(nutrients))) {
      return { ok: false, reason: "invalid_nutrients" };
    }

    const trimmedName = name.trim();
    if (await dishRepository.findGlobalByName(trimmedName, dishId)) {
      return { ok: false, reason: "duplicate_name" };
    }

    try {
      const updated = await dishRepository.updateGlobalWithNutrients({
        dishId,
        name: trimmedName,
        imageUrl,
        nutrients,
      });
      if (!updated) return { ok: false, reason: "not_found" };

      return {
        ok: true,
        dish: toMyDishItem(updated),
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

  async removeGlobal(
    dishId: number,
  ): Promise<
    { ok: true; imageUrl: string | null } | { ok: false; reason: "not_found" }
  > {
    const deleted = await dishRepository.deleteGlobalWithCleanup(dishId);
    if (!deleted) return { ok: false, reason: "not_found" };
    return { ok: true, imageUrl: deleted.image_url };
  },
};
