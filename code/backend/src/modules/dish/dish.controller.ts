import { Request, Response } from "express";
import { sendServerError } from "../../utils/http.util";
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

function parseDishId(raw: string): number | null {
  const id = parseInt(raw, 10);
  return Number.isNaN(id) ? null : id;
}

export const dishController = {
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
      return sendServerError(res, error);
    }
  },

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
      return sendServerError(res, error);
    }
  },

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

      const imageUrl =
        req.file && "path" in req.file ? (req.file.path as string) : undefined;

      const result = await dishService.createMyDish(
        req.user.userId,
        parsed.data.name,
        parsed.data.nutrients,
        imageUrl,
      );

      if (!result.ok) {
        if (result.reason === "duplicate_name") {
          return res.status(409).json({
            error: "Bạn đã có món trùng tên. Vui lòng đặt tên khác.",
          });
        }
        return res.status(400).json({
          error: "Chất dinh dưỡng không hợp lệ hoặc thiếu macro bắt buộc.",
        });
      }

      return res.status(201).json(result.dish);
    } catch (error) {
      return sendServerError(res, error);
    }
  },

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
      return sendServerError(res, error);
    }
  },

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

      const newImageUrl =
        req.file && "path" in req.file ? (req.file.path as string) : undefined;

      const result = await dishService.updateMyDish(
        req.user.userId,
        dishId,
        parsed.data.name,
        parsed.data.nutrients,
        newImageUrl,
      );

      if (!result.ok) {
        if (result.reason === "not_found") {
          return res.status(404).json({ error: "Không tìm thấy món của bạn" });
        }
        if (result.reason === "duplicate_name") {
          return res.status(409).json({
            error: "Bạn đã có món trùng tên. Vui lòng đặt tên khác.",
          });
        }
        return res.status(400).json({
          error: "Chất dinh dưỡng không hợp lệ hoặc thiếu macro bắt buộc.",
        });
      }

      if (
        newImageUrl &&
        result.oldImageUrl &&
        result.oldImageUrl !== newImageUrl
      ) {
        await destroyCloudinaryImage(result.oldImageUrl);
      }

      return res.json(result.dish);
    } catch (error) {
      return sendServerError(res, error);
    }
  },

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
      if (!result.ok) {
        return res.status(404).json({ error: "Không tìm thấy món của bạn" });
      }

      await destroyCloudinaryImage(result.imageUrl);

      return res.json({ message: "Đã xóa món thành công" });
    } catch (error) {
      return sendServerError(res, error);
    }
  },
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
      return sendServerError(res, error);
    }
  },

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
      return sendServerError(res, error);
    }
  },

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

      const imageUrl =
        req.file && "path" in req.file ? (req.file.path as string) : undefined;

      const result = await dishService.createGlobalDish(
        req.user.userId,
        parsed.data.name,
        parsed.data.nutrients,
        imageUrl,
      );

      if (!result.ok) {
        if (result.reason === "duplicate_name") {
          return res.status(409).json({
            error: "Đã có món hệ thống trùng tên. Vui lòng đặt tên khác.",
          });
        }
        return res.status(400).json({
          error: "Chất dinh dưỡng không hợp lệ hoặc thiếu macro bắt buộc.",
        });
      }

      return res.status(201).json(result.dish);
    } catch (error) {
      return sendServerError(res, error);
    }
  },

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

      const newImageUrl =
        req.file && "path" in req.file ? (req.file.path as string) : undefined;

      const result = await dishService.updateGlobalDish(
        dishId,
        parsed.data.name,
        parsed.data.nutrients,
        newImageUrl,
      );

      if (!result.ok) {
        if (result.reason === "not_found") {
          return res.status(404).json({ error: "Không tìm thấy món hệ thống" });
        }
        if (result.reason === "duplicate_name") {
          return res.status(409).json({
            error: "Đã có món hệ thống trùng tên. Vui lòng đặt tên khác.",
          });
        }
        return res.status(400).json({
          error: "Chất dinh dưỡng không hợp lệ hoặc thiếu macro bắt buộc.",
        });
      }

      if (
        newImageUrl &&
        result.oldImageUrl &&
        result.oldImageUrl !== newImageUrl
      ) {
        await destroyCloudinaryImage(result.oldImageUrl);
      }

      return res.json(result.dish);
    } catch (error) {
      return sendServerError(res, error);
    }
  },

  async removeGlobalDish(req: Request<{ dishId: string }>, res: Response) {
    try {
      const dishId = parseDishId(req.params.dishId);
      if (dishId === null) {
        return res.status(400).json({ error: "ID món không hợp lệ" });
      }

      const result = await dishService.removeGlobalDish(dishId);
      if (!result.ok) {
        return res.status(404).json({ error: "Không tìm thấy món hệ thống" });
      }

      await destroyCloudinaryImage(result.imageUrl);

      return res.json({ message: "Đã xóa món hệ thống thành công" });
    } catch (error) {
      return sendServerError(res, error);
    }
  },
};
