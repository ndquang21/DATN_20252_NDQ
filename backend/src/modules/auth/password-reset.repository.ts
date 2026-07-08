import { prisma } from "../../config/prisma";

export const passwordResetRepository = {
  // Tạo Reset Token
  create(userId: number, token: string, expiresAt: Date) {
    return prisma.passwordResetToken.create({
      data: { user_id: userId, token, expires_at: expiresAt },
    });
  },

  // Tìm token
  findByToken(token: string) {
    return prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });
  },

  // Xóa theo token
  deleteByToken(token: string) {
    return prisma.passwordResetToken.deleteMany({ where: { token } });
  },

  // Xóa theo ID
  deleteByUserId(userId: number) {
    return prisma.passwordResetToken.deleteMany({
      where: { user_id: userId },
    });
  },
};