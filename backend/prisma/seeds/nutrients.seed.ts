import { prisma } from "../../src/config/prisma";

const defaultNutrients = [
  { name: "Calories", is_macro: true, unit: "kcal" },
  { name: "Protein", is_macro: true, unit: "g" },
  { name: "Carbohydrate", is_macro: true, unit: "g" },
  { name: "Fat", is_macro: true, unit: "g" },

  { name: "Nước", is_macro: false, unit: "g" },
  { name: "Fiber", is_macro: false, unit: "g" },
  { name: "Saturated Fat", is_macro: false, unit: "g" },
  { name: "Trans Fat", is_macro: false, unit: "g" },

  { name: "Canxi", is_macro: false, unit: "mg" },
  { name: "Sắt", is_macro: false, unit: "mg" },
  { name: "Natri", is_macro: false, unit: "mg" },
  { name: "Kali", is_macro: false, unit: "mg" },
  { name: "Magie", is_macro: false, unit: "mg" },
  { name: "Kẽm", is_macro: false, unit: "mg" },

  { name: "Cholesterol", is_macro: false, unit: "mg" },
  { name: "Purin", is_macro: false, unit: "mg" },
  { name: "DHA", is_macro: false, unit: "mg" },
  { name: "EPA", is_macro: false, unit: "mg" },
  { name: "Folat", is_macro: false, unit: "mcg" },
  { name: "Vitamin C", is_macro: false, unit: "mg" },
  { name: "Vitamin B1", is_macro: false, unit: "mg" },
  { name: "Vitamin B2", is_macro: false, unit: "mg" },
  { name: "Vitamin B6", is_macro: false, unit: "mg" },
  { name: "Vitamin PP", is_macro: false, unit: "mg" },
];

export async function seedNutrients() {
  console.log("[Nutrient Seed] Đang nạp danh mục chất dinh dưỡng...");

  for (const nutrient of defaultNutrients) {
    await prisma.nutrient.upsert({
      where: { name: nutrient.name },
      update: {
        is_macro: nutrient.is_macro,
        unit: nutrient.unit as "kcal" | "g" | "mg" | "mcg",
      },
      create: {
        name: nutrient.name,
        is_macro: nutrient.is_macro,
        unit: nutrient.unit as "kcal" | "g" | "mg" | "mcg",
      },
    });
  }

  console.log("[Nutrient Seed] Hoàn thành nạp 24 chất dinh dưỡng.");
}