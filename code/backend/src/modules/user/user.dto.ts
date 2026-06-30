import {
  Gender,
  Goal,
  ActivityLevel,
  Role,
  NutrientUnit,
} from "../../../prisma/generated/prisma/client";

export type CreateUserDTO = {
  email: string;
  password: string;
  username: string;
  role: Role;
}

export type UpdateUserDTO = {
  username?: string;
  gender?: Gender;
  dob?: Date;

  height?: number;
  weight?: number;
  activity_level?: ActivityLevel;
  goal?: Goal;
}

export type ChangePasswordDTO = {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export type UpdateUserByAdminDTO = {
  username?: string;
  email?: string;
  gender?: Gender;
  date_of_birth?: Date;

  height?: number;
  weight?: number;
  activity_level?: ActivityLevel;
  goal?: Goal;
}

export type AdminUserListItemDTO = {
  user_id: number;
  email: string;
  username: string;
  role: Role;
  gender: Gender | null;
  dob: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type AdminUserDetailDTO = AdminUserListItemDTO & {
  avatar_url: string | null;
};

export type AdminUserListResponseDTO = {
  items: AdminUserListItemDTO[];
  total: number;
  page: number;
  pageSize: number;
};

export type TrackedNutrientSlotDTO = {
  sortOrder: number;
  nutrientId: number;
  name: string;
  unit: NutrientUnit;
};

export type TrackedNutrientsResponseDTO = {
  slots: TrackedNutrientSlotDTO[];
};

export type UpdateTrackedNutrientsBodyDTO = {
  slots: { sortOrder: number; nutrientId: number }[];
};