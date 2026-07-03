import { useCallback, useEffect, useState } from "react";
import { FlaskConical, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import AdminPageShell from "../../components/admin/AdminPageShell";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import NutrientFormModal from "../../components/admin/NutrientFormModal";
import { nutrientService } from "../../services/nutrient.service";
import type { NutrientItem } from "../../types/nutrient";

export default function AdminNutrientsPage() {
  const [items, setItems] = useState<NutrientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshSeq, setRefreshSeq] = useState(0);

  const [formTarget, setFormTarget] = useState<NutrientItem | null | "create">(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<NutrientItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const reload = useCallback(() => setRefreshSeq((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    nutrientService
      .list()
      .then((res) => {
        if (!active) return;
        setItems(res.data.items);
      })
      .catch(() => {
        if (active) setError("Không tải được danh sách chất dinh dưỡng.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshSeq]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError(null);
    try {
      await nutrientService.delete(deleteTarget.nutrientId);
      setDeleteTarget(null);
      reload();
    } catch {
      setActionError("Không xóa được chất dinh dưỡng.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminPageShell
      title="Chất dinh dưỡng"
      description="Danh sách các chất dinh dưỡng trong hệ thống."
      action={
        <button
          type="button"
          onClick={() => setFormTarget("create")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-primary text-white hover:bg-primary/90 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Thêm chất
        </button>
      }
    >
      {actionError && (
        <p className="mb-4 text-sm text-tertiary">{actionError}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-on-surface-variant">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-tertiary py-8 text-center">{error}</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Chưa có chất dinh dưỡng nào.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-outline-variant/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low text-left text-on-surface-variant">
                <th className="px-4 py-3 font-semibold w-12">#</th>
                <th className="px-4 py-3 font-semibold">Tên</th>
                <th className="px-4 py-3 font-semibold w-24">Đơn vị</th>
                <th className="px-4 py-3 font-semibold w-28 text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={item.nutrientId}
                  className="border-t border-outline-variant/40 hover:bg-surface-container-low/50"
                >
                  <td className="px-4 py-3 text-on-surface-variant">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 font-medium text-on-surface">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {item.unit}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end items-center gap-1">
                      {item.isSystemMacro ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                          Hệ thống
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setFormTarget(item)}
                            className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 cursor-pointer"
                            title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="p-2 rounded-lg text-on-surface-variant hover:text-tertiary hover:bg-tertiary/10 cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formTarget === "create" && (
        <NutrientFormModal
          onClose={() => setFormTarget(null)}
          onSaved={() => {
            setFormTarget(null);
            reload();
          }}
          onSubmit={async (payload) => {
            await nutrientService.create(payload);
          }}
        />
      )}

      {formTarget && formTarget !== "create" && (
        <NutrientFormModal
          nutrient={formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={() => {
            setFormTarget(null);
            reload();
          }}
          onSubmit={async (payload) => {
            await nutrientService.update(formTarget.nutrientId, payload);
          }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title="Xóa chất dinh dưỡng?"
        description={
          <>
            Chất{" "}
            <strong className="text-on-surface">{deleteTarget?.name}</strong> sẽ
            bị gỡ khỏi mọi món và mọi user đang theo dõi. Thao tác không hoàn
            tác.
          </>
        }
        confirmLabel="Xóa"
        danger
        loading={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </AdminPageShell>
  );
}
