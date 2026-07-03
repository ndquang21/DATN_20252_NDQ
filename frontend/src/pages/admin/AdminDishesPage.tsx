import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import AdminPageShell from "../../components/admin/AdminPageShell";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import AdminDishModal from "../../components/admin/AdminDishModal";
import { adminDishService } from "../../services/adminDish.service";
import type { AdminGlobalDishListItem } from "../../types/adminDish";

import { DEFAULT_DISH_IMAGE_URL } from "../../constants/default-images";

const PAGE_SIZE = 20;

export default function AdminDishesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [dishes, setDishes] = useState<AdminGlobalDishListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshSeq, setRefreshSeq] = useState(0);

  const [deleteTarget, setDeleteTarget] =
    useState<AdminGlobalDishListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [formTarget, setFormTarget] = useState<
    AdminGlobalDishListItem | null | "create"
  >(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    adminDishService
      .list({ search: debouncedSearch, page, pageSize: PAGE_SIZE })
      .then((res) => {
        if (!active) return;
        setDishes(res.data.items);
        setTotal(res.data.total);
      })
      .catch(() => {
        if (active) setError("Không tải được danh sách món hệ thống.");
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

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError(null);
    try {
      await adminDishService.delete(deleteTarget.dishId);
      setDeleteTarget(null);
      setRefreshSeq((n) => n + 1);
      if (dishes.length === 1 && page > 1) setPage((p) => p - 1);
    } catch {
      setActionError("Không xóa được món.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminPageShell
      title="Món ăn hệ thống"
      description="Danh sách món ăn trong hệ thống."
    >
      <div className="rounded-2xl border border-outline-variant bg-white shadow-sm overflow-hidden">
        {actionError && (
          <p className="mx-4 mt-3 text-sm text-tertiary bg-tertiary/10 rounded-xl px-4 py-2">
            {actionError}
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-outline-variant/60 bg-surface-container-low/50">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <UtensilsCrossed className="w-4 h-4 text-primary" />
            <span>
              Tổng: <strong className="text-on-surface">{total}</strong> món
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên món..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => setFormTarget("create")}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Tạo món
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-on-surface-variant">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Đang tải...</span>
          </div>
        ) : error ? (
          <p className="py-12 text-center text-sm text-tertiary">{error}</p>
        ) : dishes.length === 0 ? (
          <p className="py-12 text-center text-sm text-on-surface-variant">
            {debouncedSearch
              ? "Không có món khớp từ khóa."
              : "Chưa có món hệ thống nào."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/60 text-left text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                  <th className="px-4 py-3 w-16">Ảnh</th>
                  <th className="px-4 py-3">Tên món</th>
                  <th className="px-4 py-3 text-right">kcal</th>
                  <th className="px-4 py-3 text-right">P (g)</th>
                  <th className="px-4 py-3 text-right">C (g)</th>
                  <th className="px-4 py-3 text-right">F (g)</th>
                  <th className="px-4 py-3 text-right w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {dishes.map((d) => (
                  <tr
                    key={d.dishId}
                    className="border-b border-outline-variant/30 hover:bg-surface-container-low/40"
                  >
                    <td className="px-4 py-3">
                      <img
                        src={d.imageUrl ?? DEFAULT_DISH_IMAGE_URL}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-on-surface">
                      {d.name}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {d.caloriesPer100g}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {d.proteinPer100g}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {d.carbPer100g}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {d.fatPer100g}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setFormTarget(d)}
                          className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 cursor-pointer"
                          title="Sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(d)}
                          className="p-2 rounded-lg text-on-surface-variant hover:text-tertiary hover:bg-tertiary/10 cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
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
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-outline-variant/60 text-sm text-on-surface-variant">
            <span>
              Trang {page}/{totalPages}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={!canPrev}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-outline-variant disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-surface-container-low"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={!canNext}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-outline-variant disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-surface-container-low"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {formTarget != null && (
        <AdminDishModal
          dishId={formTarget === "create" ? undefined : formTarget.dishId}
          onClose={() => setFormTarget(null)}
          onSaved={() => {
            setFormTarget(null);
            setRefreshSeq((n) => n + 1);
          }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title="Xóa món hệ thống?"
        description={
          <>
            Món{" "}
            <strong className="text-on-surface">{deleteTarget?.name}</strong>{" "}
            sẽ bị gỡ khỏi mọi bữa đang dùng. Không hoàn tác.
          </>
        }
        confirmLabel="Xóa"
        danger
        loading={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </AdminPageShell>
  );
}