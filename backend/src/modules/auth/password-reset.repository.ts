import { prisma } from "../../config/prisma";

export const passwordResetRepository = {
  deleteByUserId(userId: number) {
    return prisma.passwordResetToken.deleteMany({
      where: { user_id: userId },
    });
  },

  create(userId: number, token: string, expiresAt: Date) {
    return prisma.passwordResetToken.create({
      data: { user_id: userId, token, expires_at: expiresAt },
    });
  },

  findByToken(token: string) {
    return prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });
  },

  deleteByToken(token: string) {
    return prisma.passwordResetToken.deleteMany({ where: { token } });
  },
};