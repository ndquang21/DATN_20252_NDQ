import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import HomePage from "./pages/user/HomePage";
import BasicInfo from "./pages/user/UserProfile";
import UserSuggestPlansPage from "./pages/user/UserSuggestPlansPage";
import UserSuggestPlanDetailPage from "./pages/user/UserSuggestPlanDetailPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminDishesPage from "./pages/admin/AdminDishesPage";
import AdminSuggestPlansPage from "./pages/admin/AdminSuggestPlansPage";
import AdminSuggestPlanEditorPage from "./pages/admin/AdminSuggestPlanEditorPage";
import AdminNutrientsPage from "./pages/admin/AdminNutrientsPage";

import GuestLayout from "./components/layouts/GuestLayout";
import UserLayout from "./components/layouts/UserLayout";
import AdminLayout from "./components/layouts/AdminLayout";

import NotFound from "./pages/NotFound";

import RoleRoute from "./components/auth/RoleRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";

function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#edfcec] text-[#4f6f52]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-[#4f6f52] border-t-transparent" />
          <p className="text-sm font-medium">Đang tải phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<GuestLayout />}>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate
                to={user?.role === "admin" ? "/admin" : "/home"}
                replace
              />
            ) : (
              <LandingPage />
            )
          }
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<HomePage />} />
        <Route path="/basic-info" element={<BasicInfo />} />
        <Route path="/suggest-plans" element={<UserSuggestPlansPage />} />
        <Route path="/suggest-plans/:id" element={<UserSuggestPlanDetailPage />} />
      </Route>

      <Route element={
          <RoleRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/dishes" element={<AdminDishesPage />} />
        <Route path="/admin/suggest-plans" element={<AdminSuggestPlansPage />} />
        <Route path="/admin/suggest-plans/new" element={<AdminSuggestPlanEditorPage />} />
        <Route path="/admin/suggest-plans/:id/edit" element={<AdminSuggestPlanEditorPage />} />
        <Route path="/admin/nutrients" element={<AdminNutrientsPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
