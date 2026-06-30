import { prisma } from "../../config/prisma";
import { NutrientUnit } from "../../../prisma/generated/prisma/client";

const nutrientSelect = {
  nutrient_id: true,
  name: true,
  is_macro: true,
  unit: true,
} as const;

export const nutrientRepository = {
  findAll() {
    return prisma.nutrient.findMany({
      select: nutrientSelect,
      orderBy: { nutrient_id: "asc" },
    });
  },

  findById(id: number) {
    return prisma.nutrient.findUnique({
      where: { nutrient_id: id },
      select: nutrientSelect,
    });
  },

  findByIds(ids: number[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return prisma.nutrient.findMany({
      where: { nutrient_id: { in: ids } },
      select: { nutrient_id: true, name: true },
    });
  },

  create(input: { name: string; unit: NutrientUnit }) {
    return prisma.nutrient.create({
      data: {
        name: input.name,
        unit: input.unit,
        is_macro: false,
      },
      select: nutrientSelect,
    });
  },

  update(id: number, input: { name: string; unit: NutrientUnit }) {
    return prisma.nutrient.update({
      where: { nutrient_id: id },
      data: {
        name: input.name,
        unit: input.unit,
      },
      select: nutrientSelect,
    });
  },

  delete(id: number) {
    return prisma.nutrient.delete({
      where: { nutrient_id: id },
      select: nutrientSelect,
    });
  },
};
