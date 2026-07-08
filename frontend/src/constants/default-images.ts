export const DEFAULT_DISH_IMAGE_URL =
  "https://res.cloudinary.com/dmsaxoicv/image/upload/v1780986989/default_dish.png";

export const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/dmsaxoicv/image/upload/v1780986989/default_avatar.jpg";

// Hàm kiểm tra có phải ảnh mặc định
export function isDefaultDishImage(url: string | null | undefined): boolean {
  return !url || url.includes("default_dish");
}
