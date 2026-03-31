import { userRepository } from "./user.repository";
import type {
  CreateUserDTO,
  TrackedNutrientsResponseDTO,
  UpdateTrackedNutrientsBodyDTO,
} from "./user.dto";
import { Prisma } from "../../../prisma/generated/prisma/client";
import bcrypt from "bcrypt";


export const userService = {
  async listForAdmin(search: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      userRepository.findForAdmin(search, skip, pageSize),
      userRepository.countForAdmin(search),
    ]);
    return { items, total, page, pageSize };
  },

  async getUserByIdForAdmin(user_id: number) {
    return userRepository.findByIdForAdmin(user_id);
  },

  async getUserById(user_id: number) {
    return userRepository.findById(user_id);
  },

  async createUser(data: CreateUserDTO) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return userRepository.create({
      ...data,
      password: hashedPassword,
    });
  },

  async deleteUser(user_id: number) {
    return userRepository.delete(user_id);
  },

  async updateUser(user_id: number, data: Prisma.UserUpdateInput) {
    return userRepository.update(user_id, data);
  },


  calculateMetrics(user: any) {
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


  async updateBasicInfo(user_id: number, data: any) {
    const updatedUser = await userRepository.update(user_id, {
      gender: data.gender,
      dob: data.dob ? new Date(data.dob) : undefined,
      height: data.height,
      weight: data.weight,
      activity_level: data.activity_level,
      goal: data.goal
    });

    const metrics = this.calculateMetrics(updatedUser);
    if (metrics) {
      await userRepository.update(user_id, { TDEE: metrics.tdee });
    }

    return {
      user: updatedUser,
      metrics
    };
  },

  async getMyBasicInfo(user_id: number) {
    const user = await userRepository.findById(user_id);
    if (!user) throw new Error("User not found");

    const metrics = this.calculateMetrics(user);
    
    return {
      user,
      metrics
    };
  },

  async changePassword(user_id: number, data: any) {
    const user = await userRepository.findByIdWithPassword(user_id);
    if (!user) throw new Error("User not found");

    const isMatch = await bcrypt.compare(data.current_password, user.password);
    if (!isMatch) throw new Error("Mật khẩu hiện tại không chính xác");

    const hashedPassword = await bcrypt.hash(data.new_password, 10);
    return userRepository.update(user_id, { password: hashedPassword });
  },

  async updateAvatar(user_id: number, avatar_url: string) {
    const user = await userRepository.findById(user_id);
    if (!user) throw new Error("User not found");

    return userRepository.update(user_id, { avatar_url });
  },

  async getTrackedNutrients(
    user_id: number,
  ): Promise<TrackedNutrientsResponseDTO> {
    const rows = await userRepository.findTrackedNutrients(user_id);
    return {
      slots: rows.map((r) => ({
        sortOrder: r.sort_order,
        nutrientId: r.nutrient.nutrient_id,
        name: r.nutrient.name,
        unit: r.nutrient.unit,
      })),
    };
  },

  async updateTrackedNutrients(
    user_id: number,
    body: UpdateTrackedNutrientsBodyDTO,
  ): Promise<TrackedNutrientsResponseDTO> {
    const ids = body.slots.map((s) => s.nutrientId);
    const nutrients = await userRepository.findNutrientsByIds(ids);

    if (nutrients.length !== ids.length) {
      throw new Error("Có chất dinh dưỡng không tồn tại");
    }

    if (nutrients.some((n) => n.is_macro)) {
      throw new Error("Không thể theo dõi chất macro hệ thống");
    }

    await userRepository.replaceTrackedNutrients(user_id, body.slots);
    return this.getTrackedNutrients(user_id);
  },
};
