import { z } from "zod";

export const searchDishesQuerySchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

const nutrientInputSchema = z.object({
  nutrientId: z.coerce.number().int().positive(),
  value: z.coerce.number().min(0).max(100_000),
});

// form gửi kèm cả file ảnh lẫn dữ liệu JSON (nutrients), kiểu gửi multipart/form-data không giữ được cấu trúc JSON
// hàm này parse ngược lại thành mảng thật trước khi zod kiểm tra tiếp
function parseNutrientsField(val: unknown): unknown {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}

export const createDishBodySchema = z.object({
  name: z.string().trim().min(1, "Tên món không được để trống").max(200),
  nutrients: z.preprocess(
    parseNutrientsField,
    z
      .array(nutrientInputSchema)
      .min(4, "Cần ít nhất 4 chỉ số macro")
      .refine(
        (items) =>
          new Set(items.map((i) => i.nutrientId)).size === items.length,
        "Không được trùng chất dinh dưỡng",
      ),
  ),
});

export const updateDishBodySchema = createDishBodySchema;

// Query list món global cho admin 
export const adminGlobalDishesQuerySchema = searchDishesQuerySchema;

// Body tạo/sửa món global  
export const adminCreateGlobalDishBodySchema = createDishBodySchema;
export const adminUpdateGlobalDishBodySchema = updateDishBodySchema;
