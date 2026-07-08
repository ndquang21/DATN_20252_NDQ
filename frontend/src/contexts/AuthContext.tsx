import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/auth.service";
import { userService } from "../services/user.service";

type User = {
  user_id: number;
  email: string;
  username?: string;
  role: string;
  avatar_url?: string;
};

// Định nghĩa dữ liệu và hàm mà Context sẽ cung cấp cho hệ thống
type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Xóa thông tin khi đăng xuất
    const handleAuthLogout = () => {
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    };

    // Khôi phục phiên từ localStorage
    const restoreSession = async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      const savedUser = localStorage.getItem("user");

      // Không có thông tin thì đăng xuất
      if (!refreshToken || !savedUser) {
        handleAuthLogout();
        setIsLoading(false);
        return;
      }

      try {
        // Khôi phục nhanh thông tin người dùng từ bộ nhớ tạm
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);

        // Gọi API xác thực đồng bộ thông tin mới nhất
        const response = await userService.getProfile();
        const currentUser = response.data.user;
        setUser(currentUser);

        // Cập nhật dữ liệu người dùng mới nhất vào localStorage
        localStorage.setItem("user", JSON.stringify(currentUser));
      } catch {
        // Nếu API trả về lỗi thì đăng xuất
        handleAuthLogout();
      } finally {
        setIsLoading(false);
      }
    };

    // lắng nghe sự kiện "auth:logout" (api.ts)
    window.addEventListener("auth:logout", handleAuthLogout);

    // Khôi phục phiên
    void restoreSession();

    return () => {
      window.removeEventListener("auth:logout", handleAuthLogout);
    };
  }, []);

  const login = (nextUser: User, accessToken: string, refreshToken: string) => {
    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        setUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}