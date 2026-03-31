import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "foodi/avatars",
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      public_id: `avatar_${Date.now()}`,
    };
  },
});

const dishStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "foodi/dishes",
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      public_id: `dish_${Date.now()}`,
    };
  },
});

const suggestPlanStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async () => {
    return {
      folder: "foodi/suggest-plans",
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      public_id: `suggest_plan_${Date.now()}`,
    };
  },
});

export const uploadAvatar = multer({ storage: avatarStorage });
export const uploadDishImage = multer({ storage: dishStorage });
export const uploadSuggestPlanImage = multer({ storage: suggestPlanStorage });