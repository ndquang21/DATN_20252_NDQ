import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

type RoleRouteProps = {
  allowedRoles: string[];
  children: React.ReactNode;
};

export default function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Kiểm tra danh sách quyền
  if (!user || !user.role || !allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
