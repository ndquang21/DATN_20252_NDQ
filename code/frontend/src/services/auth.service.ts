import type { AxiosRequestConfig } from "axios";
import { api } from "./api";

export type AuthUser = {
  user_id: number;
  email: string;
  username: string;
  role: string;
  avatar_url?: string
};

export type AuthResponse = {
  token: string;
  refreshToken: string;
  user: AuthUser;
};

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  email: string;
  password: string;
  username: string;
};

type RefreshResponse = {
  token: string;
};

type CurrentUserResponse = {
  user: {
    user_id: number;
    email: string;
    username: string;
    role: string;
    avatar_url: string,
    gender: string | null;
    dob: string | null;
    height: number | null;
    weight: number | null;
    activity_level: string | null;
    TDEE: number | null;
    goal: string | null;
  };
  metrics: {
    tdee: number;
  } | null;
};

const authRequestConfig: AxiosRequestConfig = {
  skipAuthRefresh: true,
};

export const authService = {
  login(payload: LoginPayload) {
    return api.post<AuthResponse>("/auth/login", payload, authRequestConfig);
  },

  register(payload: RegisterPayload) {
    return api.post<AuthResponse>("/auth/register", payload, authRequestConfig);
  },

  refresh(refreshToken: string) {
    return api.post<RefreshResponse>(
      "/auth/refresh",
      { refreshToken },
      authRequestConfig,
    );
  },

  me() {
    return api.get<CurrentUserResponse>("/users/me");
  },

  logout(refreshToken: string) {
    return api.post("/auth/logout", { refreshToken }, authRequestConfig);
  },

  forgotPassword(email: string) {
    return api.post<{ message: string }>(
      "/auth/forgot-password",
      { email },
      authRequestConfig,
    );
  },

  resetPassword(payload: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    return api.post<{ message: string }>(
      "/auth/reset-password",
      payload,
      authRequestConfig,
    );
  },
};
