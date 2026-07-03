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

// Trích public_id của Cloudinary từ URL ảnh.
// Vd: .../upload/v123/foodi/dishes/dish_1.jpg -> "foodi/dishes/dish_1"
export function getPublicIdFromUrl(url: string): string | null {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    const publicIdWithExt = parts[1].split("/").slice(1).join("/");
    return publicIdWithExt.split(".").slice(0, -1).join(".");
  } catch {
    return null;
  }
}

// Xóa ảnh cũ trên Cloudinary theo URL. Bỏ qua ảnh mặc định (default_dish, default_avatar).
export async function destroyCloudinaryImage(url: string | null | undefined) {
  if (!url || url.includes("default_")) return;
  const publicId = getPublicIdFromUrl(url);
  if (publicId) await cloudinary.uploader.destroy(publicId);
}