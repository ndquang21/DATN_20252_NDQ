import { Router } from "express";
import { dishController } from "./dish.controller";
import { authorize, protect } from "../../middlewares/auth.middleware";
import { uploadDishImage } from "../../config/cloudinary";

export const router = Router();

router.use(protect);router.get("/global", authorize("admin"), dishController.listGlobal);
router.get(
  "/global/:dishId",
  authorize("admin"),
  dishController.getGlobalById,
);
router.post(
  "/global",
  authorize("admin"),
  uploadDishImage.single("image"),
  dishController.createGlobal,
);
router.patch(
  "/global/:dishId",
  authorize("admin"),
  uploadDishImage.single("image"),
  dishController.updateGlobal,
);
router.delete(
  "/global/:dishId",
  authorize("admin"),
  dishController.removeGlobal,
);router.get("/mine", dishController.listMine);
router.get("/mine/:dishId", dishController.getMineById);
router.get("/", dishController.search);
router.post("/", uploadDishImage.single("image"), dishController.create);
router.patch("/:dishId", uploadDishImage.single("image"), dishController.update);
router.delete("/:dishId", dishController.remove);