import { Prisma } from "../../../prisma/generated/prisma/client";
import { isLockedMacroName } from "../../constants/nutrient-names";
import { nutrientRepository } from "./nutrient.repository";
import {
  NutrientDetailDTO,
  NutrientItemDTO,
  NutrientListResponseDTO,
} from "./nutrient.dto";
import { NutrientUnit } from "../../../prisma/generated/prisma/client";

function toItemDTO(row: {
  nutrient_id: number;
  name: string;
  is_macro: boolean;
  unit: NutrientUnit;
}): NutrientItemDTO {
  return {
    nutrientId: row.nutrient_id,
    name: row.name,
    isMacro: row.is_macro,
    unit: row.unit,
    isSystemMacro: isLockedMacroName(row.name),
  };
}

export const nutrientService = {
  async list(): Promise<NutrientListResponseDTO> {
    const rows = await nutrientRepository.findAll();
    return { items: rows.map(toItemDTO) };
  },

  async create(
    name: string,
    unit: NutrientUnit,
  ): Promise<
    | { ok: true; nutrient: NutrientDetailDTO }
    | { ok: false; reason: "duplicate_name" }
  > {
    try {
      const created = await nutrientRepository.create({ name, unit });
      return { ok: true, nutrient: toItemDTO(created) };
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

  async update(
    id: number,
    name: string,
    unit: NutrientUnit,
  ): Promise<
    | { ok: true; nutrient: NutrientDetailDTO }
    | {
        ok: false;
        reason: "not_found" | "locked" | "duplicate_name";
      }
  > {
    const existing = await nutrientRepository.findById(id);
    if (!existing) return { ok: false, reason: "not_found" };
    if (isLockedMacroName(existing.name)) {
      return { ok: false, reason: "locked" };
    }

    try {
      const updated = await nutrientRepository.update(id, { name, unit });
      return { ok: true, nutrient: toItemDTO(updated) };
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
    id: number,
  ): Promise<
    | { ok: true; nutrient: NutrientDetailDTO }
    | { ok: false; reason: "not_found" | "locked" }
  > {
    const existing = await nutrientRepository.findById(id);
    if (!existing) return { ok: false, reason: "not_found" };
    if (isLockedMacroName(existing.name)) {
      return { ok: false, reason: "locked" };
    }

    const deleted = await nutrientRepository.delete(id);
    return { ok: true, nutrient: toItemDTO(deleted) };
  },
};
