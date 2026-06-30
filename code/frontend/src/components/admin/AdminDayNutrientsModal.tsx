import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import NutrientGrid from "../home/NutrientGrid";
import { suggestPlanService } from "../../services/suggestPlan.service";
import type { NutrientValue } from "../../types/dailyPlan";

type Props = {
  suggestPlanId: number;
  dayIndex: number;
  onClose: () => void;
};

export default function AdminDayNutrientsModal({
  suggestPlanId,
  dayIndex,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<NutrientValue[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    suggestPlanService
      .getDayNutrients(suggestPlanId, dayIndex)
      .then((res) => {
        if (!cancelled) setTotals(res.data.totals);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg =
            (err as { response?: { data?: { error?: string } } })?.response
              ?.data?.error ?? "Không tải được dinh dưỡng ngày.";
          setError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [suggestPlanId, dayIndex]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <h3 className="font-display font-extrabold text-lg text-on-surface">
            Dinh dưỡng — Ngày {dayIndex}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 font-medium text-center py-8">
              {error}
            </p>
          ) : (
            <NutrientGrid nutrients={totals} />
          )}
        </div>
      </div>
    </div>
  );
}
