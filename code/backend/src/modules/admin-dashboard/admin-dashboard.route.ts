import { Router } from "express";
import { authorize, protect } from "../../middlewares/auth.middleware";
import { adminDashboardController } from "./admin-dashboard.controller";

export const router = Router();

router.use(protect);
router.use(authorize("admin"));

router.get("/stats", adminDashboardController.getStats);