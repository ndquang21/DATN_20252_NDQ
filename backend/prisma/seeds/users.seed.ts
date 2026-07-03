import bcrypt from "bcrypt";
import { prisma } from "../../src/config/prisma";

export type SeedUsersResult = {
  adminUserId: number;
};

const DEFAULT_ADMIN = {
  username: "admin",
  email: "admin@gmail.com",
  password: "123456",
};

export async function seedUsers(): Promise<SeedUsersResult> {
  console.log("[User Seed] Đang khởi tạo tài khoản demo...");

  const username = process.env.SEED_ADMIN_USERNAME ?? DEFAULT_ADMIN.username;
  const email = process.env.SEED_ADMIN_EMAIL ?? DEFAULT_ADMIN.email;
  const plainPassword =
    process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_ADMIN.password;
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      username,
      password: hashedPassword,
      role: "admin",
    },
    create: {
      username,
      email,
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log(`[User Seed] Admin demo: ${email}`);

  return { adminUserId: admin.user_id };
}
