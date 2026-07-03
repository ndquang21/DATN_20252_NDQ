import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  UtensilsCrossed,
  ImageOff,
  Pencil,
  Trash2,
} from "lucide-react";
import ConfirmDialog from "../admin/ConfirmDialog";
import CreateDishModal from "./CreateDishModal";
import { dishService } from "../../services/dish.service";
import type { MyDishItem } from "../../types/dish";

export default function MyDishesSection() {
  const [dishes, setDishes] = useState<MyDishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editDishId, setEditDishId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MyDishItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadDishes = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await dishService.listMyDishes();
      setDishes(res.data.items);
    } catch {
      setLoadError("Không tải được danh sách món của bạn.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDishes();
  }, [loadDishes]);

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    setActionError(null);
    try {
      await dishService.deleteDish(deleteTarget.dishId);
      setDishes((prev) => prev.filter((x) => x.dishId !== deleteTarget.dishId));
      setDeleteTarget(null);
    } catch {
      setActionError("Không xóa được món.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-primary" />
          <h2 className="font-display font-extrabold text-2xl text-on-surface">
            Món của tôi
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-primary text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-primary/90 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tạo món
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-on-surface-variant">Đang tải...</p>
      ) : loadError ? (
        <p className="text-sm text-tertiary">{loadError}</p>
      ) : dishes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-outline-variant py-12 text-center text-on-surface-variant">
          <p className="font-semibold">Bạn chưa tạo món nào.</p>
          <p className="text-sm">Bấm "Tạo món" để thêm món của riêng bạn.</p>
        </div>
      ) : (
        <>
          {actionError && (
            <p className="text-sm text-tertiary bg-tertiary/10 rounded-xl px-4 py-2">
              {actionError}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {dishes.map((d) => (
              <div
                key={d.dishId}
                className="rounded-2xl border border-outline-variant/60 overflow-hidden bg-white"
              >
                <div className="h-28 bg-slate-50 flex items-center justify-center">
                  {d.imageUrl ? (
                    <img
                      src={d.imageUrl}
                      alt={d.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <ImageOff className="w-6 h-6 text-on-surface-variant" />
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm text-on-surface truncate">
                    {d.name}
                  </p>
                  <p className="text-xs text-on-surface-variant mb-1">
                    {Math.round(d.caloriesPer100g)} kcal / 100g
                  </p>
                  <div className="flex gap-2 text-[10px] font-semibold text-on-surface-variant mb-2">
                    <span>P {d.proteinPer100g}</span>
                    <span>C {d.carbPer100g}</span>
                    <span>F {d.fatPer100g}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditDishId(d.dishId)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-primary bg-primary/10 rounded-full py-1.5 hover:bg-primary/20 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(d)}
                      disabled={deleting && deleteTarget?.dishId === d.dishId}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-tertiary bg-tertiary/10 rounded-full py-1.5 hover:bg-tertiary/20 disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showCreate && (
        <CreateDishModal
          onClose={() => setShowCreate(false)}
          onSaved={(dish) => {
            setDishes((prev) => [dish, ...prev]);
            setShowCreate(false);
          }}
        />
      )}

      {editDishId != null && (
        <CreateDishModal
          dishId={editDishId}
          onClose={() => setEditDishId(null)}
          onSaved={(dish) => {
            setDishes((prev) =>
              prev.map((x) => (x.dishId === dish.dishId ? dish : x)),
            );
            setEditDishId(null);
          }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title="Xóa món?"
        description={
          <>
            Món{" "}
            <strong className="text-on-surface">{deleteTarget?.name}</strong> sẽ
            bị gỡ khỏi các bữa đang dùng. Thao tác này không thể hoàn tác.
          </>
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        danger
        loading={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
