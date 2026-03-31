import type { NutrientValue } from "../../types/dailyPlan";

export default function NutrientGrid({
  nutrients,
}: {
  nutrients: NutrientValue[];
}) {
  const macros = nutrients.filter((n) => n.isMacro);
  const micros = nutrients.filter((n) => !n.isMacro);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
      {[...macros, ...micros].map((n) => (
        <div
          key={n.nutrientId}
          className="flex justify-between text-sm border-b border-slate-100/70 py-1"
        >
          <span
            className={
              n.isMacro
                ? "font-semibold text-on-surface"
                : "text-on-surface-variant"
            }
          >
            {n.name}
          </span>
          <span className="font-bold text-on-surface shrink-0 ml-2">
            {n.value} {n.unit}
          </span>
        </div>
      ))}
    </div>
  );
}
