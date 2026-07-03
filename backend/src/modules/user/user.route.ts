import { Router } from "express";
import { userController } from "./user.controller";
import { authorize, protect } from "../../middlewares/auth.middleware";
import { uploadAvatar } from "../../config/cloudinary";

export const router = Router();

router.use(protect);

router.get("/me", userController.getMe);
router.get("/me/tracked-nutrients", userController.getTrackedNutrients);
router.put("/me/tracked-nutrients", userController.updateTrackedNutrients);
router.put("/me/basic-info", userController.updateBasicInfo);
router.put("/me/password", userController.changePassword);
router.put("/me/avatar", uploadAvatar.single("image"), userController.uploadAvatar);
router.get("/", authorize("admin"), userController.listUsers);
router.get("/:id", authorize("admin"), userController.getUserById);
router.post("/", authorize("admin"), userController.createUser);
router.delete("/:id", authorize("admin"), userController.remove);