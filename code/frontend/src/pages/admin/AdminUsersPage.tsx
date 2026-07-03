import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Users,
  Plus,
  Trash2,
  Eye,
} from "lucide-react";
import AdminPageShell from "../../components/admin/AdminPageShell";
import CreateUserModal from "../../components/admin/CreateUserModal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import UserDetail from "../../components/admin/UserDetail";

import { adminUserService } from "../../services/adminUser.service";
import type { AdminUserListItem } from "../../types/adminUser";
import { useAuth } from "../../contexts/AuthContext";
import { formatDate } from "../../utils/format.util";

const PAGE_SIZE = 20;

function roleLabel(role: AdminUserListItem["role"]) {
  return role === "admin" ? "Admin" : "User";
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [refreshSeq, setRefreshSeq] = useState(0);

  const { user: currentUser } = useAuth();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminUserListItem | null>(
    null,
  );
  const [detailUserId, setDetailUserId] = useState<number | null>(null);  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    adminUserService
      .listUsers({ search: debouncedSearch, page, pageSize: PAGE_SIZE })
      .then((res) => {
        if (!active) return;
        setUsers(res.data.items);
        setTotal(res.data.total);
      })
      .catch(() => {
        if (active) setError("Không tải được danh sách người dùng.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, page, refreshSeq]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  function openDeleteDialog(target: AdminUserListItem) {
    if (currentUser && target.user_id === currentUser.user_id) {
      setActionError("Không thể xóa tài khoản đang đăng nhập.");
      return;
    }
    setActionError(null);
    setDeleteTarget(target);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.user_id);
    setActionError(null);
    try {
      await adminUserService.deleteUser(deleteTarget.user_id);
      setDeleteTarget(null);
      setRefreshSeq((n) => n + 1);
      if (users.length === 1 && page > 1) {
        setPage((p) => p - 1);
      }
    } catch {
      setActionError("Không xóa được user.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminPageShell
      title="Quản lý người dùng"
      description="Danh sách tài khoản trong hệ thống."
    >
      <div className="rounded-2xl border border-outline-variant bg-white shadow-sm overflow-hidden">
        {actionError && (
          <p className="mb-3 text-sm text-tertiary bg-tertiary/10 rounded-xl px-4 py-2">
            {actionError}
          </p>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-outline-variant/60 bg-surface-container-low/50">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Users className="w-4 h-4 text-primary" />
            <span>
              Tổng: <strong className="text-on-surface">{total}</strong> tài
              khoản
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm username hoặc email..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Tạo user
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-on-surface-variant">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="py-12 px-4 text-center">
            <p className="text-sm text-tertiary">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <p className="py-12 text-center text-sm text-on-surface-variant">
            {debouncedSearch
              ? "Không có user khớp từ khóa."
              : "Chưa có người dùng nào."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/60 text-left text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.user_id}
                    className="border-b border-outline-variant/30 last:border-0 hover:bg-surface-container-low/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-on-surface">
                      {u.username}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          u.role === "admin"
                            ? "bg-primary/15 text-primary"
                            : "bg-slate-100 text-on-surface-variant"
                        }`}
                      >
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailUserId(u.user_id)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteDialog(u)}
                          disabled={
                            deletingId === u.user_id ||
                            currentUser?.user_id === u.user_id
                          }
                          title={
                            currentUser?.user_id === u.user_id
                              ? "Không thể xóa chính mình"
                              : "Xóa user"
                          }
                          className="inline-flex items-center gap-1 text-xs font-bold text-tertiary bg-tertiary/10 hover:bg-tertiary/20 disabled:opacity-40 disabled:cursor-not-allowed px-2.5 py-1.5 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/60 text-sm">
            <span className="text-on-surface-variant">
              Trang {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!canPrev}
                onClick={() => setPage((p) => p - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Trước
              </button>
              <button
                type="button"
                disabled={!canNext}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low cursor-pointer"
              >
                Sau <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setPage(1);
            setRefreshSeq((n) => n + 1);
          }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title="Xóa người dùng"
        danger
        confirmLabel="Xóa"
        loading={deletingId != null}
        onClose={() => {
          if (deletingId == null) setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDelete()}
        description={
          deleteTarget ? (
            <>
              Xóa tài khoản{" "}
              <strong className="text-on-surface">
                {deleteTarget.username}
              </strong>{" "}
              ({deleteTarget.email})?
              <span className="block mt-2 text-tertiary">
                Dữ liệu liên quan sẽ bị xóa vĩnh viễn. Thao tác không thể hoàn
                tác.
              </span>
            </>
          ) : null
        }
      />

      <UserDetail userId={detailUserId} onClose={() => setDetailUserId(null)} />
    </AdminPageShell>
  );
}
