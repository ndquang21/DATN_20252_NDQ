import { Request, Response } from "express";
import { sendError } from "../../utils/http.util";
import { dishService } from "./dish.service";
import {
  createDishBodySchema,
  searchDishesQuerySchema,
  adminGlobalDishesQuerySchema,
  adminCreateGlobalDishBodySchema,
  adminUpdateGlobalDishBodySchema,
} from "./dish.validation";
import { updateDishBodySchema } from "./dish.validation";
import { destroyCloudinaryImage } from "../../config/cloudinary";

// Chuyển dishId từ chuỗi URL (req.params.dishId) sang số, trả null nếu không hợp lệ
function parseDishId(raw: string): number | null {
  const id = parseInt(raw, 10);
  return Number.isNaN(id) ? null : id;
}

// Lấy URL ảnh vừa upload từ request; không có ảnh mới thì trả undefined
function getUploadedImageUrl(req: Request): string | undefined {
  if (!req.file) {
    return undefined;
  }
  if (!("path" in req.file)) {
    return undefined;
  }
  return req.file.path as string;
}

export const dishController = {
  // Tìm kiếm  (user tìm cả món hệ thống lẫn món riêng)
  async search(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const parsed = searchDishesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const { search, page, pageSize } = parsed.data;
      const result = await dishService.search(
        req.user.userId,
        search,
        page,
        pageSize,
      );
      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },


  // Danh sách món cá nhân của user
  async listMyDishes(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const parsed = searchDishesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const { page, pageSize } = parsed.data;
      const result = await dishService.listMyDishes(
        req.user.userId,
        page,
        pageSize,
      );
      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },


  //Tạo món cá nhân
  async createMyDish(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const parsed = createDishBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const imageUrl = getUploadedImageUrl(req);

      const dish = await dishService.createMyDish(
        req.user.userId,
        parsed.data.name,
        parsed.data.nutrients,
        imageUrl,
      );

      return res.status(201).json(dish);
    } catch (error) {
      return sendError(res, error);
    }
  },


  // Xem chi tiết 1 món cá nhân
  async getMyDishById(req: Request<{ dishId: string }>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const dishId = parseDishId(req.params.dishId);
      if (dishId === null) {
        return res.status(400).json({ error: "ID món không hợp lệ" });
      }

      const dish = await dishService.getMyDishById(req.user.userId, dishId);
      if (!dish) {
        return res.status(404).json({ error: "Không tìm thấy món của bạn" });
      }

      return res.json(dish);
    } catch (error) {
      return sendError(res, error);
    }
  },


  // Sửa món cá nhân
  async updateMyDish(req: Request<{ dishId: string }>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const dishId = parseDishId(req.params.dishId);
      if (dishId === null) {
        return res.status(400).json({ error: "ID món không hợp lệ" });
      }

      const parsed = updateDishBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const newImageUrl = getUploadedImageUrl(req);

      const result = await dishService.updateMyDish(
        req.user.userId,
        dishId,
        parsed.data.name,
        parsed.data.nutrients,
        newImageUrl,
      );

      if (
        newImageUrl &&
        result.oldImageUrl &&
        result.oldImageUrl !== newImageUrl
      ) {
        await destroyCloudinaryImage(result.oldImageUrl);
      }

      return res.json(result.dish);
    } catch (error) {
      return sendError(res, error);
    }
  },


  // Xóa món cá nhân
  async removeMyDish(req: Request<{ dishId: string }>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const dishId = parseDishId(req.params.dishId);
      if (dishId === null) {
        return res.status(400).json({ error: "ID món không hợp lệ" });
      }

      const result = await dishService.removeMyDish(req.user.userId, dishId);
      await destroyCloudinaryImage(result.imageUrl);

      return res.json({ message: "Đã xóa món thành công" });
    } catch (error) {
      return sendError(res, error);
    }
  },


  // (Admin) danh sách món hệ thống
  async listGlobalDishes(req: Request, res: Response) {
    try {
      const parsed = adminGlobalDishesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const { search, page, pageSize } = parsed.data;
      const result = await dishService.listGlobalDishes(
        search,
        page,
        pageSize,
      );
      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },


  // (Admin) xem chi tiết món hệ thống
  async getGlobalDishById(req: Request<{ dishId: string }>, res: Response) {
    try {
      const dishId = parseDishId(req.params.dishId);
      if (dishId === null) {
        return res.status(400).json({ error: "ID món không hợp lệ" });
      }

      const dish = await dishService.getGlobalDishById(dishId);
      if (!dish) {
        return res.status(404).json({ error: "Không tìm thấy món hệ thống" });
      }

      return res.json(dish);
    } catch (error) {
      return sendError(res, error);
    }
  },


  // (Admin) tạo món hệ thống
  async createGlobalDish(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const parsed = adminCreateGlobalDishBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const imageUrl = getUploadedImageUrl(req);

      const dish = await dishService.createGlobalDish(
        req.user.userId,
        parsed.data.name,
        parsed.data.nutrients,
        imageUrl,
      );

      return res.status(201).json(dish);
    } catch (error) {
      return sendError(res, error);
    }
  },


  // (Admin) sửa món hệ thống
  async updateGlobalDish(req: Request<{ dishId: string }>, res: Response) {
    try {
      const dishId = parseDishId(req.params.dishId);
      if (dishId === null) {
        return res.status(400).json({ error: "ID món không hợp lệ" });
      }

      const parsed = adminUpdateGlobalDishBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const newImageUrl = getUploadedImageUrl(req);

      const result = await dishService.updateGlobalDish(
        dishId,
        parsed.data.name,
        parsed.data.nutrients,
        newImageUrl,
      );

      if (
        newImageUrl &&
        result.oldImageUrl &&
        result.oldImageUrl !== newImageUrl
      ) {
        await destroyCloudinaryImage(result.oldImageUrl);
      }

      return res.json(result.dish);
    } catch (error) {
      return sendError(res, error);
    }
  },


  // (Admin) xóa món hệ thống
  async removeGlobalDish(req: Request<{ dishId: string }>, res: Response) {
    try {
      const dishId = parseDishId(req.params.dishId);
      if (dishId === null) {
        return res.status(400).json({ error: "ID món không hợp lệ" });
      }

      const result = await dishService.removeGlobalDish(dishId);
      await destroyCloudinaryImage(result.imageUrl);

      return res.json({ message: "Đã xóa món hệ thống thành công" });
    } catch (error) {
      return sendError(res, error);
    }
  },
};
