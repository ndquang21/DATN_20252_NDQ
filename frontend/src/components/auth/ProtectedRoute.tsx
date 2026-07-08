import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute( {children} : {children: React.ReactNode;}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // tạm thời không hiện gì

  if (!isAuthenticated) { 
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
