import { prisma } from "../src/config/prisma";
import { seedDishes } from "./seeds/dishes.seed";
import { seedNutrients } from "./seeds/nutrients.seed";
import { seedSuggestPlans } from "./seeds/suggest-plans.seed";
import { seedUsers } from "./seeds/users.seed";

function SeedDemo(): boolean {
  if (process.env.SEED_DEMO === "true") return true;
  return process.env.NODE_ENV !== "production";
}

async function main() {
  console.log("[Master Seed] Bắt đầu kích hoạt luồng nạp dữ liệu hệ thống...");

  await seedNutrients();

  if (SeedDemo()) {
    const { adminUserId } = await seedUsers();
    await seedDishes(adminUserId);
    await seedSuggestPlans(adminUserId);
  } else {
    console.log(
      "[Master Seed] Bỏ qua user/dish demo (production — set SEED_DEMO=true để bật).",
    );
  }

  console.log("[Master Seed] Hoàn tất.");
}

main()
  .catch((e) => {
    console.error("Lỗi xảy ra trong quá trình Seed data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
