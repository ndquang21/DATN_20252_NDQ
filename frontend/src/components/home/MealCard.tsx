import { Check, ListChecks } from "lucide-react";
import { DEFAULT_DISH_IMAGE_URL } from "../../constants/default-images";
import type { MealItem } from "../../types/dailyPlan";
import { MEAL_META } from "./mealMeta";

type MealCardProps = {
  meal: MealItem;
  onToggleFinish?: (mealId: number, isFinished: boolean) => void;
  onOpenDetail: (mealId: number) => void;  hideFinishToggle?: boolean;
  actionLabel?: string;
};

export default function MealCard({
  meal,
  onToggleFinish,
  onOpenDetail,
  hideFinishToggle = false,
  actionLabel = "Chi tiết",
}: MealCardProps) {
  const meta = MEAL_META[meal.type];

  return (
    <div
      className={`w-72 shrink-0 bg-white rounded-2xl overflow-hidden border shadow-sm transition-all ${
        meal.isFinished
          ? "border-primary ring-1 ring-primary/30"
          : "border-outline-variant/60"
      }`}
    >
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <meta.Icon className={`w-4 h-4 ${meta.color}`} />
        <span
          className={`font-display font-bold text-xs uppercase tracking-tight ${meta.color}`}
        >
          {meta.label}
        </span>
      </div>

      <div className="relative h-32">
        <img
          src={meal.coverImageUrl ?? DEFAULT_DISH_IMAGE_URL}
          alt={meta.label}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <span className="absolute left-3 top-3 bg-white/90 text-on-surface text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
          {Math.round(meal.calories)} kcal
        </span>
        {!hideFinishToggle && (
          <button
            type="button"
            onClick={() => onToggleFinish?.(meal.mealId, !meal.isFinished)}
            title={
              meal.isFinished ? "Bỏ đánh dấu hoàn thành" : "Đánh dấu hoàn thành"
            }
            className={`absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer ${
              meal.isFinished
                ? "bg-primary text-white"
                : "bg-white/90 text-on-surface-variant hover:text-primary"
            }`}
          >
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex justify-end border-t border-slate-50 pt-2.5">
          <button
            type="button"
            onClick={() => onOpenDetail(meal.mealId)}
            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
          >
            <ListChecks className="w-3.5 h-3.5" /> {actionLabel}
          </button>
        </div>
        <ul className="space-y-1.5">
          {meal.dishes.map((dish) => (
            <li
              key={dish.dishId}
              className="flex justify-between text-xs text-on-surface-variant"
            >
              <span className="font-medium truncate max-w-[150px]">
                {dish.name}
              </span>
              <span className="font-bold text-on-surface shrink-0">
                {dish.grams}g
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
