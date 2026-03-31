import { prisma } from "../../config/prisma";
import { Prisma } from "../../../prisma/generated/prisma/client";
import { CreateUserDTO } from "./user.dto";

const adminListSelect = {
  user_id: true,
  email: true,
  username: true,
  role: true,
  gender: true,
  dob: true,
  created_at: true,
  updated_at: true,
} as const;

function buildAdminListWhere(search: string): Prisma.UserWhereInput {
  if (!search) return {};
  return {
    OR: [
      { username: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ],
  };
}

export const userRepository = {
  findById(user_id: number) {
    return prisma.user.findUnique({
      where: { user_id },
      select: {
        user_id: true,
        email: true,
        username: true,
        role: true,
        avatar_url: true,
        gender: true,
        dob: true,
        height: true,
        weight: true,
        activity_level: true,
        TDEE: true,
        goal: true,
        created_at: true,
        updated_at: true,
      },
    });
  },

  findByIdForAdmin(user_id: number) {
    return prisma.user.findUnique({
      where: { user_id },
      select: {
        user_id: true,
        email: true,
        username: true,
        role: true,
        avatar_url: true,
        gender: true,
        dob: true,
        created_at: true,
        updated_at: true,
      },
    });
  },

  findByIdWithPassword(user_id: number) {
    return prisma.user.findUnique({ where: { user_id } });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findForAdmin(search: string, skip: number, take: number) {
    return prisma.user.findMany({
      where: buildAdminListWhere(search),
      select: adminListSelect,
      orderBy: { created_at: "desc" },
      skip,
      take,
    });
  },

  countForAdmin(search: string) {
    return prisma.user.count({ where: buildAdminListWhere(search) });
  },

  create(data: CreateUserDTO) {
    return prisma.user.create({ data });
  },

  delete(user_id: number) {
    return prisma.user.delete({ where: { user_id } });
  },

  update(user_id: number, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { user_id }, data });
  },

  findTrackedNutrients(user_id: number) {
    return prisma.userTrackedNutrient.findMany({
      where: { user_id },
      orderBy: { sort_order: "asc" },
      include: {
        nutrient: {
          select: {
            nutrient_id: true,
            name: true,
            unit: true,
            is_macro: true,
          },
        },
      },
    });
  },

  findNutrientsByIds(ids: number[]) {
    return prisma.nutrient.findMany({
      where: { nutrient_id: { in: ids } },
      select: {
        nutrient_id: true,
        name: true,
        unit: true,
        is_macro: true,
      },
    });
  },

  replaceTrackedNutrients(
    user_id: number,
    slots: { sortOrder: number; nutrientId: number }[],
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.userTrackedNutrient.deleteMany({ where: { user_id } });
      if (slots.length > 0) {
        await tx.userTrackedNutrient.createMany({
          data: slots.map((s) => ({
            user_id,
            nutrient_id: s.nutrientId,
            sort_order: s.sortOrder,
          })),
        });
      }
    });
  },
};
