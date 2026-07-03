import { Flame, Plus } from "lucide-react";
import type { MealItem, MealType } from "../../types/dailyPlan";
import MealCard from "./MealCard";
import { MEAL_META } from "./mealMeta";

type DayMealsProps = {
  meals: MealItem[];
  loading: boolean;
  onToggleFinish: (mealId: number, isFinished: boolean) => void;
  onOpenDetail: (mealId: number) => void;
  onAddMeal: (type: MealType) => void;
};

const FIXED_ORDER: MealType[] = ["breakfast", "lunch", "dinner"];

export default function DayMeals({
  meals,
  loading,
  onToggleFinish,
  onOpenDetail,
  onAddMeal,
}: DayMealsProps) {
  const snacks = meals.filter((m) => m.type === "snack");

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-primary" />
        <h2 className="font-display font-extrabold text-2xl text-on-surface">
          Thực đơn
        </h2>
      </div>

      {loading ? (
        <p className="text-sm text-on-surface-variant py-10 text-center">
          Đang tải thực đơn...
        </p>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-3">
          {FIXED_ORDER.map((type) => {
            const meal = meals.find((m) => m.type === type);
            return meal ? (
              <MealCard
                key={type}
                meal={meal}
                onToggleFinish={onToggleFinish}
                onOpenDetail={onOpenDetail}
              />
            ) : (
              <AddMealCard key={type} type={type} onAdd={() => onAddMeal(type)} />
            );
          })}

          {snacks.map((meal) => (
            <MealCard
              key={meal.mealId}
              meal={meal}
              onToggleFinish={onToggleFinish}
              onOpenDetail={onOpenDetail}
            />
          ))}

          <AddMealCard type="snack" onAdd={() => onAddMeal("snack")} />
        </div>
      )}
    </section>
  );
}

function AddMealCard({
  type,
  onAdd,
}: {
  type: MealType;
  onAdd: () => void;
}) {
  const meta = MEAL_META[type];
  return (
    <button
      type="button"
      onClick={onAdd}
      className="w-72 shrink-0 min-h-[180px] flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all cursor-pointer"
    >
      <Plus className="w-6 h-6" />
      <span className="text-sm font-semibold">
        Thêm {meta.label.toLowerCase()}
      </span>
    </button>
  );
}