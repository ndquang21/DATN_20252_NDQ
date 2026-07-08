import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

// Cấu hình mở rộng axios
declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuthRefresh?: boolean;
  }
}

// Định nghĩa địa chỉ Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Kiểu dữ liệu ApiRequestConfig
type ApiRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Lấy access token
    const accessToken = localStorage.getItem("accessToken");
    // Gắn access token vào header
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor
api.interceptors.response.use(
  // Thành công
  (response) => response,

  // Thất bại
  async (error: AxiosError) => {
    // Nhặt lại request cũ
    const originalRequest = error.config as ApiRequestConfig | undefined;

    // Không có cấu hình gốc thì bỏ qua
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Kiểm tra xem có phải 401
    const isUnauthorized = error.response?.status === 401;
    // Kiểm tra xem có phải request đổi token
    const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");

    if (
      !isUnauthorized ||                // Không phải lỗi hết phiên 401
      originalRequest._retry ||         // Đã tái gửi 1 lần
      isRefreshRequest ||               // request đổi token lỗi
      originalRequest.skipAuthRefresh   // chủ động bỏ qua làm mới
    ) {
      // Trả về lỗi cho client
      return Promise.reject(error);
    }

    // Đánh dấu cho yêu cầu gốc đã xử lý tái gửi
    originalRequest._retry = true;
    try {
      // Lấy refresh token
      const refreshToken = localStorage.getItem("refreshToken");
      // Nếu không có thì logout
      if (!refreshToken) {
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(error);
      }

      // Request đổi token bằng refresh api
      const refreshResponse = await refreshApi.post("/auth/refresh", {
        refreshToken,
      });

      // Access token mới
      const newAccessToken = refreshResponse.data.token as string;
      localStorage.setItem("accessToken", newAccessToken);

      // Gắn access token mới vào request original
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      // Gửi lại request
      return api(originalRequest);
    } catch (refreshError) {
      // Đăng xuất
      window.dispatchEvent(new Event("auth:logout"));
      return Promise.reject(refreshError);
    }
  },
);
