import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Select from "../../components/ui/Select";
import AdminPageShell from "../../components/admin/AdminPageShell";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import { DEFAULT_DISH_IMAGE_URL } from "../../constants/default-images";
import { suggestPlanService } from "../../services/suggestPlan.service";
import type {
  SuggestPlanListItem,
  SuggestPlanListSort,
} from "../../types/suggestPlan";
import { formatDate } from "../../utils/format.util";

const PAGE_SIZE = 20;

const SORT_OPTIONS: { value: SuggestPlanListSort; label: string }[] = [
  { value: "created_desc", label: "Mới nhất" },
  { value: "created_asc", label: "Cũ nhất" },
  { value: "public_first", label: "Công khai trước" },
  { value: "hidden_first", label: "Ẩn trước" },
];

export default function AdminSuggestPlansPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SuggestPlanListSort>("created_desc");

  const [items, setItems] = useState<SuggestPlanListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshSeq, setRefreshSeq] = useState(0);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<SuggestPlanListItem | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sort]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    suggestPlanService
      .list({ search: debouncedSearch, page, pageSize: PAGE_SIZE, sort })
      .then((res) => {
        if (!active) return;
        setItems(res.data.items);
        setTotal(res.data.total);
      })
      .catch(() => {
        if (active) setError("Không tải được danh sách thực đơn gợi ý.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, page, refreshSeq, sort]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  async function handleCreate() {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await suggestPlanService.create({});
      navigate(`/admin/suggest-plans/${res.data.suggestPlanId}/edit`);
    } catch {
      setCreateError("Không tạo được thực đơn gợi ý.");
    } finally {
      setCreating(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError(null);
    try {
      await suggestPlanService.delete(deleteTarget.suggestPlanId);
      setDeleteTarget(null);
      setRefreshSeq((n) => n + 1);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
    } catch {
      setActionError("Không xóa được thực đơn gợi ý.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminPageShell
      title="Thực đơn gợi ý"
      description="Danh sách thực đơn gợi ý cho người dùng."
      action={
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Tạo thực đơn
        </button>
      }
    >
      <div className="rounded-2xl border border-outline-variant bg-white shadow-sm overflow-hidden">
        {(actionError || createError) && (
          <p className="mx-4 mt-3 text-sm text-tertiary bg-tertiary/10 rounded-xl px-4 py-2">
            {actionError ?? createError}
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4 border-b border-outline-variant/60 bg-surface-container-low/50">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant shrink-0">
            <CalendarRange className="w-4 h-4 text-primary" />
            <span>
              Tổng: <strong className="text-on-surface">{total}</strong> gợi ý
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto sm:ml-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên hoặc mô tả..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-outline-variant bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <Select
              value={sort}
              onChange={setSort}
              options={SORT_OPTIONS}
              menuAlign="end"
              className="w-full sm:w-auto sm:min-w-[11rem]"
              aria-label="Sắp xếp"
            />
          </div>
        </div>

        {error && (
          <p className="px-4 py-8 text-center text-sm text-tertiary">{error}</p>
        )}

        {!error && loading && (
          <p className="px-4 py-12 text-center text-sm text-on-surface-variant inline-flex items-center justify-center gap-2 w-full">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
          </p>
        )}

        {!error && !loading && items.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-on-surface-variant">
            {debouncedSearch
              ? "Không có gợi ý nào khớp tìm kiếm."
              : 'Chưa có thực đơn gợi ý. Bấm "Tạo thực đơn" để bắt đầu.'}
          </p>
        )}

        {!error && !loading && items.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/60 text-left text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                    <th className="px-4 py-3 w-16">Ảnh</th>
                    <th className="px-4 py-3">Tên</th>
                    <th className="px-4 py-3">Tiến độ</th>
                    <th className="px-4 py-3">Ngày tạo</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right w-36">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr
                      key={row.suggestPlanId}
                      className="border-b border-outline-variant/30 hover:bg-surface-container-low/40"
                    >
                      <td className="px-4 py-3">
                        <img
                          src={row.imageUrl ?? DEFAULT_DISH_IMAGE_URL}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-on-surface">
                          {row.name}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant tabular-nums">
                        {row.completeDayCount}/{row.dayCount}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant tabular-nums whitespace-nowrap">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {row.isPublic ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                            <Eye className="w-3 h-3" /> Hiển thị
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-on-surface-variant">
                            <EyeOff className="w-3 h-3" /> Ẩn
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/admin/suggest-plans/${row.suggestPlanId}/edit`}
                            className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10"
                            title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(row)}
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-outline-variant/60">
                <p className="text-xs text-on-surface-variant">
                  Trang {page}/{totalPages}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={!canPrev}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-2 rounded-lg border border-outline-variant disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={!canNext}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-2 rounded-lg border border-outline-variant disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa thực đơn gợi ý"
        description={
          <>
            Bạn có chắc muốn xóa{" "}
            <strong>{deleteTarget?.name ?? "gợi ý này"}</strong>? Không thể hoàn
            tác.
          </>
        }
        confirmLabel="Xóa"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => !deleting && setDeleteTarget(null)}
      />
    </AdminPageShell>
  );
}
