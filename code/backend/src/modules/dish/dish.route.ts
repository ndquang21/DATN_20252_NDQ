import { Router } from "express";
import { dishController } from "./dish.controller";
import { authorize, protect } from "../../middlewares/auth.middleware";
import { uploadDishImage } from "../../config/cloudinary";

export const router = Router();

router.use(protect);router.get("/global", authorize("admin"), dishController.listGlobalDishes);
router.get(
  "/global/:dishId",
  authorize("admin"),
  dishController.getGlobalDishById,
);
router.post(
  "/global",
  authorize("admin"),
  uploadDishImage.single("image"),
  dishController.createGlobalDish,
);
router.patch(
  "/global/:dishId",
  authorize("admin"),
  uploadDishImage.single("image"),
  dishController.updateGlobalDish,
);
router.delete(
  "/global/:dishId",
  authorize("admin"),
  dishController.removeGlobalDish,
);router.get("/mine", dishController.listMyDishes);
router.get("/mine/:dishId", dishController.getMyDishById);
router.get("/", dishController.search);
router.post("/", uploadDishImage.single("image"), dishController.createMyDish);
router.patch("/:dishId", uploadDishImage.single("image"), dishController.updateMyDish);
router.delete("/:dishId", dishController.removeMyDish);