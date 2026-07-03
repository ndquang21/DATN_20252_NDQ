import { useState } from "react";
import { Loader2, X } from "lucide-react";
import Calendar from "../home/Calendar";
import Select from "../ui/Select";
import { suggestPlanService } from "../../services/suggestPlan.service";
import type {
  ApplySuggestPlanBody,
  ApplySuggestPlanScope,
} from "../../types/suggestPlan";
import type { MealType } from "../../types/dailyPlan";
import { todayStr } from "../../utils/format.util";

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Sáng" },
  { value: "lunch", label: "Trưa" },
  { value: "dinner", label: "Tối" },
  { value: "snack", label: "Phụ" },
];

type Props = {
  scope: ApplySuggestPlanScope;
  onClose: () => void;
  onSuccess?: (affectedDates: string[]) => void;
};

export default function ApplySuggestPlanModal({
  scope,
  onClose,
  onSuccess,
}: Props) {
  const [targetDate, setTargetDate] = useState(todayStr());
  const [targetMealType, setTargetMealType] = useState<MealType>("lunch");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title =
    scope.kind === "plan"
      ? "Áp dụng cả thực đơn"
      : scope.kind === "day"
        ? `Áp dụng Ngày ${scope.sourceDayIndex}`
        : "Áp dụng bữa";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let body: ApplySuggestPlanBody;
    if (scope.kind === "plan") {
      body = { scope: "plan", startDate: targetDate };
    } else if (scope.kind === "day") {
      body = {
        scope: "day",
        sourceDayIndex: scope.sourceDayIndex,
        targetDate,
      };
    } else {
      body = {
        scope: "meal",
        sourceMealId: scope.sourceMealId,
        targetDate,
        targetMealType,
      };
    }

    try {
      const res = await suggestPlanService.applyPublic(scope.suggestPlanId, body);
      onSuccess?.(res.data.affectedDates);
      onClose();
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "error" in err.response.data &&
        typeof err.response.data.error === "string"
          ? err.response.data.error
          : "Không áp dụng được. Thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-display font-extrabold text-lg text-on-surface">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <p className="text-sm font-semibold text-on-surface mb-2">
              {scope.kind === "plan" ? "Ngày bắt đầu" : "Chọn ngày trên lịch"}
            </p>
            <Calendar selectedDate={targetDate} onSelectDate={setTargetDate} />
          </div>

          {scope.kind === "meal" && (
            <div>
              <p className="text-sm font-semibold text-on-surface mb-2">
                Bữa
              </p>
              <Select
                value={targetMealType}
                onChange={setTargetMealType}
                options={MEAL_TYPE_OPTIONS}
                className="w-full"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-tertiary bg-tertiary/10 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Xác nhận áp dụng
          </button>
        </form>
      </div>
    </div>
  );
}
