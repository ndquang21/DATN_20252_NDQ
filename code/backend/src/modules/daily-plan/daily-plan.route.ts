import { Router } from "express";
import { dailyPlanController } from "./daily-plan.controller";
import { protect } from "../../middlewares/auth.middleware";

export const router = Router();

router.use(protect);

router.get("/", dailyPlanController.getDailyPlan);router.post("/meals", dailyPlanController.createMeal);
router.post("/meals/:mealId/dishes", dailyPlanController.addDish);
router.patch("/meals/:mealId/dishes/:dishId", dailyPlanController.updateDish);
router.delete("/meals/:mealId/dishes/:dishId", dailyPlanController.removeDish);

router.get("/meals/:mealId/nutrients", dailyPlanController.getMealNutrients);
router.patch("/meals/:mealId/finish", dailyPlanController.finishMeal);