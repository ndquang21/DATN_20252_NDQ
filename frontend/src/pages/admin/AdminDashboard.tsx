import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UtensilsCrossed,
  CalendarRange,
  FlaskConical,
  Loader2,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import UserDetail from "../../components/admin/UserDetail";
import { adminDashboardService } from "../../services/adminDashboard.service";
import type { AdminDashboardStats } from "../../types/adminDashboard";
import type { UserRole } from "../../types/adminUser";
import { formatDate, formatDateTime } from "../../utils/format.util";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <p className="mt-4 text-2xl font-display font-extrabold text-on-surface tabular-nums">
        {value}
      </p>
      <p className="text-sm font-semibold text-on-surface mt-0.5">{label}</p>
      {sub && (
        <p className="text-xs text-on-surface-variant mt-1">{sub}</p>
      )}
    </div>
  );
}

function roleLabel(role: UserRole) {
  return role === "admin" ? "Admin" : "User";
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailUserId, setDetailUserId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    adminDashboardService
      .getStats()
      .then((res) => {
        if (active) setStats(res.data);
      })
      .catch(() => {
        if (active) setError("Không tải được thống kê.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-on-surface">
          Tổng quan
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {user?.username ? `Xin chào, ${user.username}. ` : ""}
          Tóm tắt hệ thống Foodi.
        </p>
      </div>

      {loading && (
        <p className="flex items-center gap-2 text-sm text-on-surface-variant py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
        </p>
      )}

      {error && (
        <p className="text-sm text-tertiary bg-tertiary/10 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {!loading && stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Người dùng"
              value={stats.userCount}
              sub="Tài khoản đã đăng ký"
            />
            <StatCard
              icon={UtensilsCrossed}
              label="Món hệ thống"
              value={stats.globalDishCount}
              sub="Món global (is_global)"
            />
            <StatCard
              icon={CalendarRange}
              label="Thực đơn gợi ý"
              value={stats.suggestPlanCount}
              sub={
                stats.suggestPlanPublicCount > 0
                  ? `${stats.suggestPlanPublicCount} đang hiển thị`
                  : "Chưa có gợi ý hiển thị"
              }
            />
            <StatCard
              icon={FlaskConical}
              label="Chất dinh dưỡng"
              value={stats.nutrientCount}
              sub="Trong catalog hệ thống"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="rounded-2xl border border-outline-variant bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/60">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <h2 className="font-display font-bold text-on-surface">
                    Người dùng mới
                  </h2>
                </div>
                <Link
                  to="/admin/users"
                  className="inline-flex items-center gap-0.5 text-xs font-bold text-primary hover:underline"
                >
                  Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {stats.recentUsers.length === 0 ? (
                <p className="px-5 py-10 text-sm text-center text-on-surface-variant">
                  Chưa có người dùng nào.
                </p>
              ) : (
                <ul className="divide-y divide-outline-variant/30">
                  {stats.recentUsers.map((u) => (
                    <li key={u.user_id}>
                      <button
                        type="button"
                        onClick={() => setDetailUserId(u.user_id)}
                        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-surface-container-low/60 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-on-surface truncate">
                            {u.username}
                          </p>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            Đăng ký {formatDate(u.created_at)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            u.role === "admin"
                              ? "bg-primary/15 text-primary"
                              : "bg-slate-100 text-on-surface-variant"
                          }`}
                        >
                          {roleLabel(u.role)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-outline-variant bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/60">
                <div className="flex items-center gap-2">
                  <CalendarRange className="w-4 h-4 text-primary" />
                  <h2 className="font-display font-bold text-on-surface">
                    Thực đơn gợi ý gần đây
                  </h2>
                </div>
                <Link
                  to="/admin/suggest-plans"
                  className="inline-flex items-center gap-0.5 text-xs font-bold text-primary hover:underline"
                >
                  Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {stats.recentSuggestPlans.length === 0 ? (
                <p className="px-5 py-10 text-sm text-center text-on-surface-variant">
                  Chưa có thực đơn gợi ý nào.
                </p>
              ) : (
                <ul className="divide-y divide-outline-variant/30">
                  {stats.recentSuggestPlans.map((plan) => (
                    <li key={plan.suggestPlanId}>
                      <Link
                        to={`/admin/suggest-plans/${plan.suggestPlanId}/edit`}
                        className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-surface-container-low/60 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-on-surface truncate">
                            {plan.name}
                          </p>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {plan.dayCount} ngày · Cập nhật{" "}
                            {formatDateTime(plan.updatedAt)}
                          </p>
                        </div>
                        {plan.isPublic ? (
                          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                            <Eye className="w-3 h-3" /> Hiển thị
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-on-surface-variant">
                            <EyeOff className="w-3 h-3" /> Ẩn
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      <UserDetail
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
      />
    </div>
  );
}