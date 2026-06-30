import { useEffect, useState } from "react";
import {
  X,
  Trash2,
  Loader2,
  ListChecks,
  ChevronLeft,
  Plus,
} from "lucide-react";
import type {
  DailyPlanResponse,
  MealItem,
  MealNutrients,
} from "../../types/dailyPlan";
import { dailyPlanService } from "../../services/dailyPlan.service";
import { suggestPlanService } from "../../services/suggestPlan.service";
import { MEAL_META } from "./mealMeta";
import DishSearchPanel from "./DishSearchPanel";
import { DEFAULT_DISH_IMAGE_URL } from "../../constants/default-images";
import NutrientGrid from "./NutrientGrid";

type View = "overview" | "detail" | "search";

type Props = {
  meal: MealItem;
  onClose: () => void;
  onPlanUpdated?: (plan: DailyPlanResponse) => void;
  readOnly?: boolean; // Trang gợi ý thực đơn: chỉ xem, không sửa
  onApplyMeal?: () => void;
};

export default function MealEditModal({
  meal,
  onClose,
  onPlanUpdated,
  readOnly = false,
  onApplyMeal,
}: Props) {
  const meta = MEAL_META[meal.type];
  const [view, setView] = useState<View>("overview");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailDishId, setDetailDishId] = useState<number | null>(null);

  const [nutrients, setNutrients] = useState<MealNutrients | null>(null);
  const [nutrLoading, setNutrLoading] = useState(true);
  const [nutrError, setNutrError] = useState(false);

  const dishesSig = meal.dishes.map((d) => `${d.dishId}:${d.grams}`).join(",");
  useEffect(() => {
    let active = true;
    setNutrLoading(true);
    setNutrError(false);

    const request = readOnly
      ? suggestPlanService.getPublicMealNutrients(meal.mealId)
      : dailyPlanService.getMealNutrients(meal.mealId);

    request
      .then((res) => {
        if (active) setNutrients(res.data);
      })
      .catch(() => {
        if (active) setNutrError(true);
      })
      .finally(() => {
        if (active) setNutrLoading(false);
      });

    return () => {
      active = false;
    };
  }, [meal.mealId, dishesSig, readOnly]);

  const clearDraft = (dishId: number) =>
    setDrafts((d) => {
      const n = { ...d };
      delete n[dishId];
      return n;
    });

  async function commitGram(dishId: number, currentGrams: number) {
    if (readOnly || !onPlanUpdated) return;
    const raw = drafts[dishId];
    if (raw === undefined) return;
    const val = Number(raw);
    if (!Number.isFinite(val) || val <= 0 || val === currentGrams) {
      clearDraft(dishId);
      return;
    }
    setSavingId(dishId);
    setError(null);
    try {
      const res = await dailyPlanService.updateDish(meal.mealId, dishId, val);
      onPlanUpdated(res.data);
      clearDraft(dishId);
    } catch {
      setError("Không lưu được khẩu phần, thử lại.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleRemove(dishId: number) {
    if (readOnly || !onPlanUpdated) return;
    setSavingId(dishId);
    setError(null);
    try {
      const res = await dailyPlanService.removeDish(meal.mealId, dishId);
      onPlanUpdated(res.data);
    } catch {
      setError("Không xóa được món, thử lại.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleAddDish(dishId: number) {
    if (readOnly || !onPlanUpdated) return;
    setAddingId(dishId);
    setError(null);
    try {
      const res = await dailyPlanService.addDish(meal.mealId, dishId, 100);
      onPlanUpdated(res.data);
    } catch {
      setError("Không thêm được món, thử lại.");
    } finally {
      setAddingId(null);
    }
  }

  function openDetail(dishId: number) {
    setDetailDishId(dishId);
    setView("detail");
  }

  const detailDish =
    nutrients?.dishes.find((d) => d.dishId === detailDishId) ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl h-[85vh] max-h-[680px] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <meta.Icon className={`w-5 h-5 ${meta.color}`} />
            <h3 className="font-display font-extrabold text-xl text-on-surface">
              {meta.label}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {view === "overview" && (
            <div className="h-full overflow-y-auto">
              <div className="px-6 py-4 border-b border-slate-100">
                <div
                  className={
                    readOnly
                      ? "flex items-center justify-between gap-4"
                      : "flex items-end gap-2"
                  }
                >
                  <div className="flex items-end gap-2">
                    <span className="font-display font-extrabold text-3xl text-primary">
                      {Math.round(meal.calories)}
                    </span>
                    <span className="text-on-surface-variant font-semibold mb-1">
                      kcal
                    </span>
                  </div>
                  {readOnly && (
                    <button
                      type="button"
                      onClick={onApplyMeal}
                      disabled={!onApplyMeal}
                      title={
                        onApplyMeal
                          ? undefined
                          : "Chưa cấu hình áp dụng"
                      }
                      className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Áp dụng bữa
                    </button>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-on-surface">
                    Thực đơn
                  </h4>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => setView("search")}
                      className="flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm món
                    </button>
                  )}
                </div>

                {error && <p className="text-tertiary text-sm">{error}</p>}
                {meal.dishes.length === 0 ? (
                  <p className="text-center text-on-surface-variant py-6">
                    Bữa chưa có món nào.
                  </p>
                ) : (
                  meal.dishes.map((dish) => {
                    const isSaving = savingId === dish.dishId;
                    const value = drafts[dish.dishId] ?? String(dish.grams);
                    return (
                      <div
                        key={dish.dishId}
                        className="flex items-center gap-3 rounded-2xl border border-outline-variant/50 p-3"
                      >
                        <img
                          src={dish.imageUrl ?? DEFAULT_DISH_IMAGE_URL}
                          alt={dish.name}
                          className="w-12 h-12 rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-on-surface truncate">
                            {dish.name}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {dish.calories} kcal
                          </p>
                        </div>
                        {readOnly ? (
                          <span className="text-sm font-bold text-on-surface shrink-0">
                            {dish.grams}g
                          </span>
                        ) : (
                          <>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={1}
                                value={value}
                                disabled={isSaving}
                                onChange={(e) =>
                                  setDrafts((d) => ({
                                    ...d,
                                    [dish.dishId]: e.target.value,
                                  }))
                                }
                                onBlur={() => commitGram(dish.dishId, dish.grams)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    (e.target as HTMLInputElement).blur();
                                }}
                                className="w-16 text-right rounded-lg border border-outline-variant/70 px-2 py-1 text-sm font-bold text-on-surface focus:outline-none focus:border-primary"
                              />
                              <span className="text-xs text-on-surface-variant">g</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => openDetail(dish.dishId)}
                              title="Chi tiết dinh dưỡng món"
                              className="p-2 text-on-surface-variant hover:text-primary cursor-pointer"
                            >
                              <ListChecks className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemove(dish.dishId)}
                              disabled={isSaving}
                              title="Xóa món"
                              className="p-2 text-on-surface-variant hover:text-tertiary cursor-pointer disabled:opacity-50"
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                        {readOnly && (
                          <button
                            type="button"
                            onClick={() => openDetail(dish.dishId)}
                            title="Chi tiết dinh dưỡng món"
                            className="p-2 text-on-surface-variant hover:text-primary cursor-pointer"
                          >
                            <ListChecks className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-6 pb-6">
                <h4 className="font-display font-bold text-sm text-on-surface mb-2">
                  Dinh dưỡng cả bữa
                </h4>
                {nutrLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-on-surface-variant">
                    <Loader2 className="w-5 h-5 animate-spin" /> Đang tải...
                  </div>
                ) : nutrError || !nutrients ? (
                  <p className="text-center text-tertiary py-8">
                    Không tải được dinh dưỡng bữa.
                  </p>
                ) : (
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                    <NutrientGrid nutrients={nutrients.totals} />
                  </div>
                )}
              </div>
            </div>
          )}

          {view === "detail" && (
            <div className="h-full overflow-y-auto animate-slide-in">
              <div className="px-6 py-4">
                <button
                  type="button"
                  onClick={() => setView("overview")}
                  className="flex items-center gap-1 text-sm font-bold text-primary hover:underline cursor-pointer mb-3"
                >
                  <ChevronLeft className="w-4 h-4" /> Quay lại
                </button>

                {nutrLoading ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-on-surface-variant">
                    <Loader2 className="w-5 h-5 animate-spin" /> Đang tải...
                  </div>
                ) : !detailDish ? (
                  <p className="text-center text-tertiary py-12">
                    Không tải được chi tiết món.
                  </p>
                ) : (
                  <>
                    <h3 className="font-display font-extrabold text-lg text-on-surface">
                      {detailDish.name}
                    </h3>
                    <p className="text-sm text-on-surface-variant mb-3">
                      Khẩu phần:{" "}
                      <span className="font-bold text-on-surface">
                        {detailDish.grams}g
                      </span>
                    </p>
                    <div className="rounded-2xl border border-outline-variant/50 p-4">
                      <NutrientGrid nutrients={detailDish.nutrients} />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {!readOnly && view === "search" && (
            <div className="h-full overflow-y-auto animate-slide-in">
              <div className="px-6 pt-4">
                <button
                  type="button"
                  onClick={() => setView("overview")}
                  className="flex items-center gap-1 text-sm font-bold text-primary hover:underline cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Quay lại
                </button>
              </div>
              <DishSearchPanel
                existingDishIds={meal.dishes.map((d) => d.dishId)}
                onPick={handleAddDish}
                busyDishId={addingId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
