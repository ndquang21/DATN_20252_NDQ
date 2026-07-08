import { api } from "./api";

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

type CurrentUserResponse = {
  user: {
    user_id: number;
    email: string;
    username: string;
    role: string;
    avatar_url: string;
    gender: string | null;
    dob: string | null;
    height: number | null;
    weight: number | null;
    activity_level: string | null;
    TDEE: number | null;
    goal: string | null;
  };
};

export const userService = {
  getProfile() {
    return api.get<CurrentUserResponse>("/users/me");
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
