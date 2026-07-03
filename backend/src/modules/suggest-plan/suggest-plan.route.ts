import { Router } from "express";
import { authorize, protect } from "../../middlewares/auth.middleware";
import { suggestPlanController } from "./suggest-plan.controller";
import { uploadSuggestPlanImage } from "../../config/cloudinary";

export const router = Router();

router.use(protect);

router.get("/public", suggestPlanController.listPublic);
router.get("/public/meals/:mealId/nutrients", suggestPlanController.getPublicMealNutrients);
router.get("/public/:id", suggestPlanController.getPublicById);
router.post("/public/:id/apply", suggestPlanController.applySuggestPlan);

router.use(authorize("admin"));

router.get("/", suggestPlanController.list);
router.post("/", suggestPlanController.create);

router.patch("/:id/publish", suggestPlanController.publish);
router.post("/:id/days", suggestPlanController.addDay);
router.delete("/:id/days/:dayIndex", suggestPlanController.removeDay);
router.get("/:id/days/:dayIndex/nutrients", suggestPlanController.getDayNutrients);

router.get("/:id", suggestPlanController.getById);
router.patch("/:id", uploadSuggestPlanImage.single("image"), suggestPlanController.update,);
router.delete("/:id", suggestPlanController.remove);
