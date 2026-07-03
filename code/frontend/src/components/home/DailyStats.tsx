import type {
  DailyPlanSummary,
  NutrientTotals,
  TrackedNutrientDay,
} from "../../types/dailyPlan";
import type { NutrientUnit } from "../../types/nutrient";

const ZERO: NutrientTotals = { calories: 0, protein: 0, carb: 0, fat: 0 };

type DailyStatsProps = {
  summary: DailyPlanSummary | null;
  trackedNutrients: TrackedNutrientDay[];
  tdee: number | null;
  dateLabel: string;
  isToday?: boolean;
  className?: string;
  onEditTracked?: () => void;
};

function padTrackedSlots(
  items: TrackedNutrientDay[],
): (TrackedNutrientDay | null)[] {
  const slots: (TrackedNutrientDay | null)[] = [null, null, null];
  for (const item of items) {
    if (item.sortOrder >= 0 && item.sortOrder <= 2) {
      slots[item.sortOrder] = item;
    }
  }
  return slots;
}

function formatTrackedValue(value: number, unit: NutrientUnit): string {
  const rounded =
    unit === "g" ? Math.round(value * 10) / 10 : Math.round(value * 100) / 100;
  return `${rounded} ${unit}`;
}

export default function DailyStats({
  summary,
  trackedNutrients,
  tdee,
  dateLabel,
  isToday = false,
  className = "",
  onEditTracked,
}: DailyStatsProps) {
  const completed = summary?.completed ?? ZERO;
  const showProgress = isToday && tdee != null && tdee > 0;
  const caloriePercent = showProgress
    ? Math.min(100, Math.round((completed.calories / tdee) * 100))
    : 0;
  const trackedSlots = padTrackedSlots(trackedNutrients);

  return (
    <div
      className={`bg-white rounded-2xl border border-outline-variant p-6 md:p-8 shadow-sm flex flex-col justify-between space-y-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-on-surface">
            Thống kê
          </h2>
          <p className="text-on-surface-variant text-sm font-semibold mt-1">
            Ngày {dateLabel}
          </p>
        </div>
        {onEditTracked && (
          <button
            type="button"
            onClick={onEditTracked}
            className="shrink-0 text-xs font-bold text-primary hover:text-primary/80 underline-offset-2 hover:underline cursor-pointer"
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      <div>
        <div className="flex justify-between items-end mb-2">
          <span className="text-on-surface-variant text-sm font-semibold">
            Năng lượng đã nạp
          </span>
          <div className="text-right">
            <span className="font-display font-extrabold text-3xl text-primary">
              {Math.round(completed.calories)}
            </span>
            {showProgress ? (
              <span className="text-on-surface-variant text-sm font-semibold">
                {" "}
                / {Math.round(tdee).toLocaleString()} kcal
              </span>
            ) : (
              <span className="text-on-surface-variant text-sm font-semibold">
                {" "}
                kcal
              </span>
            )}
          </div>
        </div>
        {showProgress ? (
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-container to-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${caloriePercent}%` }}
            />
          </div>
        ) : isToday ? (
          <p className="text-xs text-on-surface-variant">
            Cập nhật hồ sơ để xem khuyến nghị calo theo TDEE.
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <MacroStat label="PROTEIN" value={completed.protein} unit="g" />
          <MacroStat label="CARBS" value={completed.carb} unit="g" />
          <MacroStat label="FATS" value={completed.fat} unit="g" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {trackedSlots.map((slot, index) =>
            slot ? (
              <MacroStat
                key={slot.nutrientId}
                label={slot.name.toUpperCase()}
                value={slot.completed}
                unit={slot.unit}
              />
            ) : (
              <EmptyTrackedStat key={`empty-${index}`} />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function MacroStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/40">
      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider line-clamp-2">
        {label}
      </p>
      <p className="font-display font-bold text-on-surface text-base mt-1">
        {formatTrackedValue(value, unit as NutrientUnit)}
      </p>
    </div>
  );
}

function EmptyTrackedStat() {
  return (
    <div className="bg-surface-container-low p-4 rounded-xl border border-dashed border-outline-variant/60">
      <p className="text-[10px] text-on-surface-variant/60 font-bold uppercase tracking-wider">
        —
      </p>
      <p className="font-display font-bold text-on-surface-variant/50 text-base mt-1">
        —
      </p>
    </div>
  );
}
