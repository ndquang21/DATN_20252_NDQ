import { Sun, Sunset, Moon, Cookie } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MealType } from "../../types/dailyPlan";

export const MEAL_META: Record<
  MealType,
  { label: string; Icon: LucideIcon; color: string }
> = {
  breakfast: { label: "Bữa sáng", Icon: Sun, color: "text-secondary" },
  lunch: { label: "Bữa trưa", Icon: Sunset, color: "text-primary" },
  dinner: { label: "Bữa tối", Icon: Moon, color: "text-tertiary" },
  snack: { label: "Bữa phụ", Icon: Cookie, color: "text-on-surface-variant" },
};