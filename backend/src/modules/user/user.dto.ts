import {
  Role,
  NutrientUnit,
} from "../../../prisma/generated/prisma/client";

export type CreateUserDTO = {
  email: string;
  password: string;
  username: string;
  role?: Role;
}

export type ChangePasswordDTO = {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

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
