import type { AxiosRequestConfig } from "axios";
import { api } from "./api";

export type AuthUser = {
  user_id: number;
  email: string;
  username: string;
  role: string;
  avatar_url?: string
};

// Data trả về khi Đăng nhập/Đăng ký thành công
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

// Data trả về khi đổi Access Token
type RefreshResponse = {
  token: string;
};

// Bỏ qua làm mới
const authRequestConfig: AxiosRequestConfig = {
  skipAuthRefresh: true,
};

export const authService = {
  // Đăng nhập
  login(payload: LoginPayload) {
    return api.post<AuthResponse>("/auth/login", payload, authRequestConfig);
  },

  // Đăng ký
  register(payload: RegisterPayload) {
    return api.post<AuthResponse>("/auth/register", payload, authRequestConfig);
  },

  // Refresh
  refresh(refreshToken: string) {
    return api.post<RefreshResponse>("/auth/refresh", { refreshToken }, authRequestConfig);
  },

  
  // Đăng xuất
  logout(refreshToken: string) {
    return api.post("/auth/logout", { refreshToken }, authRequestConfig);
  },

  // Quên mật khẩu
  forgotPassword(email: string) {
    return api.post<{ message: string }>("/auth/forgot-password", { email }, authRequestConfig);
  },

  // Reset mật khẩu
  resetPassword(payload: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    return api.post<{ message: string }>( "/auth/reset-password", payload, authRequestConfig);
  },
};