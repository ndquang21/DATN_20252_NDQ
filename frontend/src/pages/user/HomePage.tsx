import { useCallback, useEffect, useState } from "react";

import Calendar from "../../components/home/Calendar";
import DailyStats from "../../components/home/DailyStats";
import DayMeals from "../../components/home/DayMeals";
import MyDishesSection from "../../components/home/MyDishesSection";
import MealEditModal from "../../components/home/MealEditModal";
import CreateMealModal from "../../components/home/CreateMealModal";
import TrackNutrientsModal from "../../components/home/TrackNutrientsModal";

import type { DailyPlanResponse, MealType } from "../../types/dailyPlan";

import { dailyPlanService } from "../../services/dailyPlan.service";
import { userService } from "../../services/user.service";

import { todayStr } from "../../utils/format.util";

function optimisticToggle(
  plan: DailyPlanResponse,
  mealId: number,
  isFinished: boolean,
): DailyPlanResponse {
  const meals = plan.meals.map((m) =>
    m.mealId === mealId ? { ...m, isFinished } : m,
  );
  const completed = { calories: 0, protein: 0, carb: 0, fat: 0 };
  for (const m of meals) {
    if (m.isFinished) {
      completed.calories += m.calories;
      completed.protein += m.protein;
      completed.carb += m.carb;
      completed.fat += m.fat;
    }
  }
  return {
    ...plan,
    meals,
    summary: plan.summary ? { ...plan.summary, completed } : plan.summary,
  };
}

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [plan, setPlan] = useState<DailyPlanResponse | null>(null);
  const [tdee, setTdee] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailMealId, setDetailMealId] = useState<number | null>(null);
  const [addMealType, setAddMealType] = useState<MealType | null>(null);
  const [trackModalOpen, setTrackModalOpen] = useState(false);

  const detailMeal = plan?.meals.find((m) => m.mealId === detailMealId) ?? null;

  useEffect(() => {
    userService
      .getProfile()
      .then((res) => setTdee(res.data.user.TDEE))
      .catch(() => setTdee(null));
  }, []);

  const loadPlan = useCallback((date: string, showLoading = true) => {
    if (showLoading) setLoading(true);
    return dailyPlanService
      .getDailyPlan(date)
      .then((res) => setPlan(res.data))
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadPlan(selectedDate);
  }, [selectedDate, loadPlan]);

  useEffect(() => {
    if (
      detailMealId !== null &&
      plan &&
      !plan.meals.some((m) => m.mealId === detailMealId)
    ) {
      setDetailMealId(null);
    }
  }, [plan, detailMealId]);

  const handleToggleFinish = async (mealId: number, isFinished: boolean) => {
    setPlan((prev) =>
      prev ? optimisticToggle(prev, mealId, isFinished) : prev,
    );
    try {
      await dailyPlanService.finishMeal(mealId, isFinished);
      await loadPlan(selectedDate, false);
    } catch {
      await loadPlan(selectedDate, false);
    }
  };

  const handlePlanUpdated = useCallback((p: DailyPlanResponse) => {
    setPlan(p);
  }, []);

  const handleAddMeal = (type: MealType) => setAddMealType(type);

  const handleMealCreated = (mealId: number, p: DailyPlanResponse) => {
    setPlan(p);
    setAddMealType(null);
    setDetailMealId(mealId);
  };

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DailyStats
          summary={plan?.summary ?? null}
          trackedNutrients={plan?.trackedNutrients ?? []}
          tdee={tdee}
          isToday={selectedDate === todayStr()}
          dateLabel={selectedDate.split("-").reverse().join("/")}
          className="lg:col-span-2"
          onEditTracked={() => setTrackModalOpen(true)}
        />
        <Calendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </section>

      <DayMeals
        meals={plan?.meals ?? []}
        loading={loading}
        onToggleFinish={handleToggleFinish}
        onOpenDetail={setDetailMealId}
        onAddMeal={handleAddMeal}
      />

      <MyDishesSection />

      {detailMeal && (
        <MealEditModal
          meal={detailMeal}
          onClose={() => setDetailMealId(null)}
          onPlanUpdated={handlePlanUpdated}
        />
      )}

      {addMealType && (
        <CreateMealModal
          date={selectedDate}
          mealType={addMealType}
          onClose={() => setAddMealType(null)}
          onCreated={handleMealCreated}
        />
      )}

      {trackModalOpen && (
        <TrackNutrientsModal
          onClose={() => setTrackModalOpen(false)}
          onSaved={() => void loadPlan(selectedDate, false)}
        />
      )}
    </div>
  );
}
