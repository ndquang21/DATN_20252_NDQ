import { api } from "./api";
import { authService } from "./auth.service";

export type Gender = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type Goal = "lose_weight" | "maintain" | "gain_weight";

export type UpdateBasicInfoPayload = {
  gender: Gender | "";
  dob: string;
  height: number;
  weight: number;
  activity_level: ActivityLevel | "";
  goal: Goal | "";
  avatar_url: string;
};

export type UpdatePasswordPayload = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

export type UpdateAvatarResponse = {
  avatar_url: string;
};

export const userService = {
  getProfile() {
    return authService.me();
  },

  updateAvatar(imageFile: File) {
    const formData = new FormData();
    formData.append("image", imageFile);
    return api.put<UpdateAvatarResponse>("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateBasicInfo(payload: UpdateBasicInfoPayload) {
    return api.put("/users/me/basic-info", payload);
  },

  updatePassword(payload: UpdatePasswordPayload) {
    return api.put("/users/me/password", payload);
  },
};
