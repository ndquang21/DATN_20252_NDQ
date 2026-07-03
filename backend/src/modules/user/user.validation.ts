import { z } from "zod";

// Admin chỉ tạo được tài khoản người dùng thường: không nhận 'role' từ input.
// Nếu client cố gửi role, Zod sẽ loại bỏ; tài khoản mới mặc định role='user' (default ở DB).
export const createUserSchema = z.object({
  email: z.email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  username: z.string().min(2, "Username tối thiểu 2 ký tự"),
});

export const updateBasicInfoSchema = z.object({
  gender: z.enum(["male", "female"], { message: "Giới tính không hợp lệ" }),
  dob: z.string().min(1, "Vui lòng nhập ngày sinh" ),
  height: z.number().min(1, "Chiều cao phải lớn hơn 0"),
  weight: z.number().min(1, "Cân nặng phải lớn hơn 0"),
  activity_level: z.enum(["sedentary", "light", "moderate", "active", "very_active"], { message: "Mức độ vận động không hợp lệ" }),
  goal: z.enum(["lose_weight", "maintain", "gain_weight"], { message: "Mục tiêu không hợp lệ" }),
});

export type UpdateBasicInfoDTO = z.infer<typeof updateBasicInfoSchema>;

export const listUsersQuerySchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

const trackedSlotSchema = z.object({
  sortOrder: z.number().int().min(0).max(2),
  nutrientId: z.number().int().positive(),
});

export const updateTrackedNutrientsSchema = z.object({
  slots: z
    .array(trackedSlotSchema)
    .length(3, "Cần chọn đúng 3 chất dinh dưỡng")
    .refine(
      (slots) => {
        const orders = [...slots.map((s) => s.sortOrder)].sort((a, b) => a - b);
        return orders[0] === 0 && orders[1] === 1 && orders[2] === 2;
      },
      "sortOrder phải là 0, 1 và 2",
    )
    .refine(
      (slots) => new Set(slots.map((s) => s.nutrientId)).size === 3,
      "Không được chọn trùng chất",
    ),
});