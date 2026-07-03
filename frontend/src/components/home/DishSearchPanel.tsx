import { useEffect, useState } from "react";
import { Search, Loader2, Plus, Check } from "lucide-react";
import { dishService } from "../../services/dish.service";
import type { DishSearchItem } from "../../types/dish";
import { DEFAULT_DISH_IMAGE_URL } from "../../constants/default-images";

type Props = {
  existingDishIds: number[];
  onPick: (dishId: number) => void;
  busyDishId?: number | null;
};

export default function DishSearchPanel({
  existingDishIds,
  onPick,
  busyDishId,
}: Props) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<DishSearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    const timer = setTimeout(() => {
      dishService
        .searchDishes(search.trim(), 1, 20)
        .then((res) => {
          if (!active) return;
          setItems(res.data.items);
          setTotal(res.data.total);
        })
        .catch(() => {
          if (active) setError(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  const existing = new Set(existingDishIds);

  return (
    <div className="px-6 py-4">
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm món (gõ có dấu: gà, cà chua)..."
          className="w-full rounded-xl border border-outline-variant/70 pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-on-surface-variant">
          <Loader2 className="w-5 h-5 animate-spin" /> Đang tìm...
        </div>
      ) : error ? (
        <p className="text-center text-tertiary py-10">
          Không tải được danh sách món.
        </p>
      ) : items.length === 0 ? (
        <p className="text-center text-on-surface-variant py-10">
          Không tìm thấy món phù hợp.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((d) => {
            const added = existing.has(d.dishId);
            const busy = busyDishId === d.dishId;
            return (
              <div
                key={d.dishId}
                className="flex items-center gap-3 rounded-2xl border border-outline-variant/50 p-3"
              >
                <img
                  src={d.imageUrl ?? DEFAULT_DISH_IMAGE_URL}
                  alt={d.name}
                  className="w-11 h-11 rounded-xl object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-on-surface truncate">
                    {d.name}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {d.caloriesPer100g} kcal / 100g
                  </p>
                </div>
                <button
                  type="button"
                  disabled={added || busy}
                  onClick={() => onPick(d.dishId)}
                  className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-colors disabled:opacity-60 ${
                    added
                      ? "bg-primary/10 text-primary cursor-default"
                      : "bg-primary text-white hover:bg-primary/90 cursor-pointer"
                  }`}
                >
                  {busy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : added ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  {added ? "Đã thêm" : "Thêm"}
                </button>
              </div>
            );
          })}
          {total > items.length && (
            <p className="text-center text-xs text-on-surface-variant pt-1">
              Nhập để tìm thêm món
            </p>
          )}
        </div>
      )}
    </div>
  );
}