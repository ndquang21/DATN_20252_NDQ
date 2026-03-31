import { useState } from "react";
import { X } from "lucide-react";
import type { DailyPlanResponse, MealType } from "../../types/dailyPlan";
import { dailyPlanService } from "../../services/dailyPlan.service";
import { MEAL_META } from "./mealMeta";
import DishSearchPanel from "./DishSearchPanel";

type Props = {
  mealType: MealType;
  onClose: () => void;
  onCreated: (mealId: number, plan: DailyPlanResponse) => void;  date?: string;  dailyPlanId?: number;
};

export default function CreateMealModal({
  mealType,
  onClose,
  onCreated,
  date,
  dailyPlanId,
}: Props) {
  const meta = MEAL_META[mealType];
  const [creatingId, setCreatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(dishId: number) {
    setCreatingId(dishId);
    setError(null);
    try {
      const body =
        dailyPlanId != null
          ? { dailyPlanId, mealType, dishId, grams: 100 }
          : { date: date!, mealType, dishId, grams: 100 };

      const res = await dailyPlanService.createMeal(body);
      onCreated(res.data.mealId, res.data.plan);
    } catch {
      setError("Không tạo được bữa, thử lại.");
      setCreatingId(null);
    }
  }

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
              Thêm {meta.label.toLowerCase()}
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
          <div className="h-full overflow-y-auto">
            <p className="px-6 pt-4 text-sm text-on-surface-variant">
              Chọn món đầu tiên cho bữa
            </p>
            {error && <p className="px-6 pt-2 text-tertiary text-sm">{error}</p>}
            <DishSearchPanel
              existingDishIds={[]}
              onPick={handlePick}
              busyDishId={creatingId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}