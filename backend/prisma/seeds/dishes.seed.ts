import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { prisma } from "../../src/config/prisma";
import { DEFAULT_DISH_IMAGE_URL } from "../../src/constants/default-images";
import type { DemoDishesSeedFile } from "./demo-dish.types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEMO_DISHES_PATH = join(__dirname, "../data/demo-dishes.json");

function loadDemoDishes(): DemoDishesSeedFile {
  const raw = readFileSync(DEMO_DISHES_PATH, "utf8");
  return JSON.parse(raw) as DemoDishesSeedFile;
}

export async function seedDishes(adminUserId: number) {
  console.log("[Dish Seed] Đang nạp món global từ demo-dishes.json...");

  const items = loadDemoDishes();
  if (items.length === 0) {
    console.log("[Dish Seed] File trống — bỏ qua (thêm món vào prisma/data/demo-dishes.json).");
    return;
  }

  const nutrientsFromDB = await prisma.nutrient.findMany();
  const nutrientMap = new Map(
    nutrientsFromDB.map((n) => [n.name, n.nutrient_id]),
  );

  for (const item of items) {
    const dishName = item.dish_name.trim();
    if (!dishName) continue;

    const dish = await prisma.dish.upsert({
      where: {
        dish_name_created_by: {
          dish_name: dishName,
          created_by: adminUserId,
        },
      },
      update: {
        image_url: DEFAULT_DISH_IMAGE_URL,
        is_global: true,
      },
      create: {
        dish_name: dishName,
        image_url: DEFAULT_DISH_IMAGE_URL,
        created_by: adminUserId,
        is_global: true,
      },
    });

    await prisma.dishNutrient.deleteMany({
      where: { dish_id: dish.dish_id },
    });

    const dishNutrientsData = Object.entries(item.nutrients)
      .map(([name, value]) => {
        const nutrientId = nutrientMap.get(name);
        if (nutrientId == null) return null;
        return {
          dish_id: dish.dish_id,
          nutrient_id: nutrientId,
          value,
        };
      })
      .filter((row) => row !== null);

    if (dishNutrientsData.length > 0) {
      await prisma.dishNutrient.createMany({ data: dishNutrientsData });
    }
  }

  console.log(`[Dish Seed] Đã nạp ${items.length} món global.`);
}
