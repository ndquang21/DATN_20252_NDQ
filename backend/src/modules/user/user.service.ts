import { userRepository } from "./user.repository";
import type {
  ChangePasswordDTO,
  CreateUserDTO,
  TrackedNutrientsResponseDTO,
  UpdateTrackedNutrientsBodyDTO,
} from "./user.dto";
import type { UpdateBasicInfoDTO } from "./user.validation";
import type { User } from "../../../prisma/generated/prisma/client";
import bcrypt from "bcrypt";
import { appError } from "../../utils/http.util";

// Các field hồ sơ cơ thể cần để tính TDEE.
type TdeeInput = Pick<
  User,
  "dob" | "height" | "weight" | "gender" | "activity_level" | "goal"
>;

export const userService = {
  // ===== User: hồ sơ, mật khẩu, dinh dưỡng theo dõi, avatar =====

  // Lấy hồ sơ của chính mình
  async getMyProfile(userId: number) {
    const user = await userRepository.findById(userId);
    if (!user) throw appError("User not found", 404);

    // TDEE đã được lưu sẵn trên user (cập nhật khi updateBasicInfo) -> trả thẳng
    return {
      user,
    };
  },

  // Lấy user theo id (dùng nội bộ, vd trước khi đổi avatar)
  async getUserById(userId: number) {
    return userRepository.findById(userId);
  },

  // Công thức tính TDEE từ hồ sơ
  calculateTdee(user: TdeeInput) {
    if (!user.dob || !user.height || !user.weight || !user.gender || !user.activity_level || !user.goal) {
      return null;
    }

    const birthYear = new Date(user.dob).getFullYear();
    const age = Math.max(12, new Date().getFullYear() - birthYear);

    let bmr = 10 * user.weight + 6.25 * user.height - 5 * age;
    bmr += user.gender === "male" ? 5 : -161;

    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    let tdee = Math.round(bmr * activityMultipliers[user.activity_level]);

    if (user.goal === "lose_weight") tdee = Math.max(1200, tdee - 300);
    if (user.goal === "gain_weight") tdee += 300;

    return { tdee };
  },

  // Cập nhật hồ sơ cơ thể, tự tính lại TDEE
  async updateBasicInfo(userId: number, data: UpdateBasicInfoDTO) {
    const dob = new Date(data.dob);

    // Tính TDEE
    const metrics = this.calculateTdee({ ...data, dob });

    const updatedUser = await userRepository.update(userId, {
      gender: data.gender,
      dob,
      height: data.height,
      weight: data.weight,
      activity_level: data.activity_level,
      goal: data.goal,
      TDEE: metrics ? metrics.tdee : null,
    });

    return {
      user: updatedUser,
    };
  },

  // Đổi mật khẩu, kiểm mật khẩu hiện tại trước
  async changePassword(userId: number, data: ChangePasswordDTO) {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw appError("User not found", 404);

    const isMatch = await bcrypt.compare(data.current_password, user.password);
    if (!isMatch) throw appError("Mật khẩu hiện tại không chính xác", 400);

    const hashedPassword = await bcrypt.hash(data.new_password, 10);
    return userRepository.update(userId, { password: hashedPassword });
  },

  // Cập nhật ảnh đại diện
  async updateAvatar(userId: number, avatar_url: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw appError("User not found", 404);

    return userRepository.update(userId, { avatar_url });
  },

  // Lấy danh sách chất dinh dưỡng đang theo dõi
  async getTrackedNutrients(
    userId: number,
  ): Promise<TrackedNutrientsResponseDTO> {
    const rows = await userRepository.findTrackedNutrients(userId);
    return {
      slots: rows.map((r) => ({
        sortOrder: r.sort_order,
        nutrientId: r.nutrient.nutrient_id,
        name: r.nutrient.name,
        unit: r.nutrient.unit,
      })),
    };
  },

  // Cập nhật danh sách chất dinh dưỡng theo dõi
  async updateTrackedNutrients(
    userId: number,
    body: UpdateTrackedNutrientsBodyDTO,
  ): Promise<TrackedNutrientsResponseDTO> {
    const ids = body.slots.map((s) => s.nutrientId);
    const nutrients = await userRepository.findNutrientsByIds(ids);

    if (nutrients.length !== ids.length) {
      throw appError("Có chất dinh dưỡng không tồn tại", 400);
    }

    if (nutrients.some((n) => n.is_macro)) {
      throw appError("Không thể theo dõi chất macro hệ thống", 400);
    }

    await userRepository.replaceTrackedNutrients(userId, body.slots);
    return this.getTrackedNutrients(userId);
  },

  // ===== Admin: quản lý user khác =====

  // Danh sách user cho admin, có tìm kiếm + phân trang
  async listForAdmin(search: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      userRepository.listForAdmin(search, skip, pageSize),
      userRepository.countForAdmin(search),
    ]);
    return { items, total, page, pageSize };
  },

  // Xem chi tiết 1 user cho admin
  async getUserByIdForAdmin(userId: number) {
    return userRepository.findByIdForAdmin(userId);
  },

  // Tạo user mới
  async createUser(data: CreateUserDTO) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw appError("Email already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return userRepository.create({
      ...data,
      password: hashedPassword,
    });
  },

  // Xóa user
  async remove(userId: number) {
    return userRepository.delete(userId);
  },
};
