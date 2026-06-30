import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, UtensilsCrossed } from "lucide-react";
import MealCard from "../../components/home/MealCard";
import MealEditModal from "../../components/home/MealEditModal";
import ApplySuggestPlanModal from "../../components/home/ApplySuggestPlanModal";
import { isDefaultDishImage } from "../../constants/default-images";
import { suggestPlanService } from "../../services/suggestPlan.service";
import type { MealItem, MealType } from "../../types/dailyPlan";
import type {
  ApplySuggestPlanScope,
  SuggestPlanPublicDay,
  SuggestPlanPublicDetail,
} from "../../types/suggestPlan";

const FIXED_MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner"];

export default function UserSuggestPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const suggestPlanId = id ? Number(id) : NaN;
  const validId = Number.isFinite(suggestPlanId) && suggestPlanId > 0;

  const [plan, setPlan] = useState<SuggestPlanPublicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [detailMeal, setDetailMeal] = useState<MealItem | null>(null);
  const [applyScope, setApplyScope] = useState<ApplySuggestPlanScope | null>(
    null,
  );
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    if (!validId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await suggestPlanService.getPublicById(suggestPlanId);
      setPlan(res.data);
      setActiveDay((prev) =>
        res.data.days.some((d) => d.dayIndex === prev)
          ? prev
          : (res.data.days[0]?.dayIndex ?? 1),
      );
    } catch {
      setLoadError("Không tải được thực đơn gợi ý.");
    } finally {
      setLoading(false);
    }
  }, [suggestPlanId, validId]);

  useEffect(() => {
    if (!validId) {
      setLoadError("Id không hợp lệ.");
      setLoading(false);
      return;
    }
    void loadPlan();
  }, [validId, loadPlan]);

  const activeDayData = plan?.days.find((d) => d.dayIndex === activeDay);

  const coverDisplaySrc = useMemo(() => {
    const url = plan?.imageUrl;
    if (url && !isDefaultDishImage(url)) return url;
    return null;
  }, [plan?.imageUrl]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-sm text-on-surface-variant">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        Đang tải...
      </div>
    );
  }

  if (loadError || !plan) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <Link
          to="/suggest-plans"
          className="inline-flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> Danh sách
        </Link>
        <p className="text-sm text-tertiary">{loadError ?? "Không có dữ liệu."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/suggest-plans"
        className="inline-flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary"
      >
        <ArrowLeft className="w-4 h-4" /> Danh sách
      </Link>

      {applySuccess && (
        <p className="text-sm text-primary bg-primary/10 rounded-xl px-4 py-2">
          {applySuccess}{" "}
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="font-bold underline cursor-pointer"
          >
            Xem lịch
          </button>
        </p>
      )}

      <div className="rounded-2xl border border-outline-variant bg-white shadow-sm p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 min-w-0 space-y-3 order-1">
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-on-surface">
              {plan.name}
            </h1>
            <p className="text-sm font-semibold text-primary">
              {plan.dayCount} ngày
            </p>
            {plan.description && (
              <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                {plan.description}
              </p>
            )}
            <button
              type="button"
              onClick={() =>
                setApplyScope({ kind: "plan", suggestPlanId: plan.suggestPlanId })
              }
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 cursor-pointer"
            >
              Áp dụng thực đơn
            </button>
          </div>

          <div className="w-full max-w-xs lg:w-56 shrink-0 order-2 mx-auto lg:mx-0">
            <div className="rounded-xl overflow-hidden bg-slate-100 aspect-[4/3]">
              {coverDisplaySrc ? (
                <img
                  src={coverDisplaySrc}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 min-h-[10rem]">
                  <UtensilsCrossed className="w-10 h-10 text-primary/40" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-4 border-b border-outline-variant/60 bg-surface-container-low/50">
          {plan.days.map((d) => (
            <button
              key={d.dayIndex}
              type="button"
              onClick={() => setActiveDay(d.dayIndex)}
              className={`px-3.5 py-2 text-sm font-bold rounded-lg cursor-pointer transition-colors ${
                activeDay === d.dayIndex
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              Ngày {d.dayIndex}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display font-extrabold text-xl text-on-surface">
              Ngày {activeDay}
            </h2>
            <button
              type="button"
              onClick={() =>
                setApplyScope({
                  kind: "day",
                  suggestPlanId: plan.suggestPlanId,
                  sourceDayIndex: activeDay,
                })
              }
              className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold border border-primary text-primary hover:bg-primary/5 cursor-pointer"
            >
              Áp dụng ngày
            </button>
          </div>

          <DayMealsRow
            day={activeDayData}
            onOpenDetail={(mealId) => {
              const meal = activeDayData?.meals.find((m) => m.mealId === mealId);
              if (meal) setDetailMeal(meal);
            }}
          />
        </div>
      </div>

      {detailMeal && (
        <MealEditModal
          meal={detailMeal}
          readOnly
          onClose={() => setDetailMeal(null)}
          onApplyMeal={() => {
            const mealId = detailMeal.mealId;
            setDetailMeal(null);
            setApplyScope({
              kind: "meal",
              suggestPlanId: plan.suggestPlanId,
              sourceMealId: mealId,
            });
          }}
        />
      )}

      {applyScope && (
        <ApplySuggestPlanModal
          scope={applyScope}
          onClose={() => setApplyScope(null)}
          onSuccess={(dates) =>
            setApplySuccess(
              `Đã áp dụng vào ${dates.length} ngày trên lịch của bạn.`,
            )
          }
        />
      )}
    </div>
  );
}

function DayMealsRow({
  day,
  onOpenDetail,
}: {
  day: SuggestPlanPublicDay | undefined;
  onOpenDetail: (mealId: number) => void;
}) {
  if (!day) return null;

  const meals = day.meals;
  const snacks = meals.filter((m) => m.type === "snack");

  return (
    <div className="flex gap-5 sm:gap-6 overflow-x-auto pb-2 -mx-1 px-1">
      {FIXED_MEAL_ORDER.map((type) => {
        const meal = meals.find((m) => m.type === type);
        if (!meal) return null;
        return (
          <MealCard
            key={meal.mealId}
            meal={meal}
            hideFinishToggle
            onOpenDetail={onOpenDetail}
          />
        );
      })}

      {snacks.map((meal) => (
        <MealCard
          key={meal.mealId}
          meal={meal}
          hideFinishToggle
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  );
}
