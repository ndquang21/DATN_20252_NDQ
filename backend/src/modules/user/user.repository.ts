import { prisma } from "../../config/prisma";
import { Prisma } from "../../../prisma/generated/prisma/client";
import { CreateUserDTO } from "./user.dto";

const adminUserListSelect = {
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
  // ===== Tra cứu user =====

  // Lấy user theo id, đủ field hồ sơ (cho chính chủ xem)
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

  // Lấy user theo id, ít field hơn (cho admin xem tổng quan)
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

  // Lấy user kèm password (chỉ dùng để so sánh mật khẩu)
  findByIdWithPassword(user_id: number) {
    return prisma.user.findUnique({ where: { user_id } });
  },

  // Tra user theo email (kiểm trùng khi đăng ký/tạo user)
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  // Danh sách user cho admin, có tìm kiếm + phân trang
  listForAdmin(search: string, skip: number, take: number) {
    return prisma.user.findMany({
      where: buildAdminListWhere(search),
      select: adminUserListSelect,
      orderBy: { created_at: "desc" },
      skip,
      take,
    });
  },

  // Đếm tổng user khớp tìm kiếm (phục vụ phân trang)
  countForAdmin(search: string) {
    return prisma.user.count({ where: buildAdminListWhere(search) });
  },

  // ===== Ghi/sửa/xóa user =====

  // Tạo user mới
  create(data: CreateUserDTO) {
    return prisma.user.create({ data });
  },

  // Cập nhật user (dùng chung: hồ sơ, mật khẩu, avatar...)
  update(user_id: number, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { user_id }, data });
  },

  // Xóa user
  delete(user_id: number) {
    return prisma.user.delete({ where: { user_id } });
  },

  // ===== Chất dinh dưỡng theo dõi =====

  // Lấy danh sách chất user đang theo dõi
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

  // Tra nhiều chất theo id (validate trước khi cập nhật theo dõi)
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

  // Xóa hết + tạo lại danh sách theo dõi trong 1 transaction
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
