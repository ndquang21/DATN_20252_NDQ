import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { adminUserService } from "../../services/adminUser.service";
import type { AdminUserDetail, Gender, UserRole } from "../../types/adminUser";
import { DEFAULT_AVATAR_URL } from "../../constants/default-images";

type Props = {
  userId: number | null;
  onClose: () => void;
};

const GENDER_LABEL: Record<Gender, string> = {
  male: "Nam",
  female: "Nữ",
};

function roleLabel(role: UserRole) {
  return role === "admin" ? "Admin" : "User";
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN");
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN");
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-outline-variant/30 last:border-0">
      <span className="text-sm text-on-surface-variant shrink-0">{label}</span>
      <span className="text-sm font-semibold text-on-surface text-right">
        {value}
      </span>
    </div>
  );
}

export default function UserDetail({ userId, onClose }: Props) {
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId == null) {
      setUser(null);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    adminUserService
      .getUserById(userId)
      .then((res) => {
        if (active) setUser(res.data);
      })
      .catch(() => {
        if (active) setError("Không tải được thông tin user.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  if (userId == null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/60 shrink-0">
          <h3
            id="user-detail-title"
            className="font-display font-extrabold text-lg text-on-surface"
          >
            Chi tiết người dùng
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-on-surface-variant">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm">Đang tải...</span>
            </div>
          ) : error ? (
            <p className="text-sm text-tertiary text-center py-12">{error}</p>
          ) : user ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={user.avatar_url || DEFAULT_AVATAR_URL}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover border border-outline-variant"
                />
                <div>
                  <p className="font-display font-bold text-lg text-on-surface">
                    {user.username}
                  </p>
                  <p className="text-sm text-on-surface-variant">
                    {user.email}
                  </p>
                  <span
                    className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      user.role === "admin"
                        ? "bg-primary/15 text-primary"
                        : "bg-slate-100 text-on-surface-variant"
                    }`}
                  >
                    {roleLabel(user.role)}
                  </span>
                </div>
              </div>

              <section>
                <h4 className="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-2">
                  Thông tin
                </h4>
                <div className="rounded-xl border border-outline-variant/60 px-4 py-1">
                  <DetailRow label="User ID" value={String(user.user_id)} />
                  <DetailRow
                    label="Ngày tạo"
                    value={formatDateTime(user.created_at)}
                  />
                  <DetailRow
                    label="Ngày cập nhật"
                    value={formatDateTime(user.updated_at)}
                  />
                  <DetailRow
                    label="Giới tính"
                    value={
                      user.gender ? GENDER_LABEL[user.gender] : "Chưa cập nhật"
                    }
                  />
                  <DetailRow label="Ngày sinh" value={formatDate(user.dob)} />
                </div>
              </section>
            </div>
          ) : null}
        </div>

        <div className="px-5 py-4 border-t border-outline-variant/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-sm font-bold rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
