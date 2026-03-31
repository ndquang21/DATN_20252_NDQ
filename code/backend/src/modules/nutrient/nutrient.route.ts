import { Router } from "express";
import { authorize, protect } from "../../middlewares/auth.middleware";
import { nutrientController } from "./nutrient.controller";

export const router = Router();

router.use(protect);

router.get("/", nutrientController.list);
router.post("/", authorize("admin"), nutrientController.create);
router.patch("/:id", authorize("admin"), nutrientController.update);
router.delete("/:id", authorize("admin"), nutrientController.remove);
