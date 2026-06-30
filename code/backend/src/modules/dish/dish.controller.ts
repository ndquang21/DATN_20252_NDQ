import { Request, Response } from "express";
import { dishService } from "./dish.service";
import {
  createDishBodySchema,
  searchDishesQuerySchema,
  adminGlobalDishesQuerySchema,
  adminCreateGlobalDishBodySchema,
  adminUpdateGlobalDishBodySchema,
} from "./dish.validation";
import { updateDishBodySchema } from "./dish.validation";
import { v2 as cloudinary } from "cloudinary";

const getPublicIdFromUrl = (url: string): string | null => {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    const publicIdWithExt = parts[1].split("/").slice(1).join("/");
    return publicIdWithExt.split(".").slice(0, -1).join(".");
  } catch {
    return null;
  }
};

async function cleanupCloudinaryImage(url: string | null | undefined) {
  if (!url || url.includes("default_dish")) return;
  const publicId = getPublicIdFromUrl(url);
  if (publicId) await cloudinary.uploader.destroy(publicId);
}

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
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async listMine(req: Request, res: Response) {
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
      const result = await dishService.listMine(
        req.user.userId,
        page,
        pageSize,
      );
      return res.json(result);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async create(req: Request, res: Response) {
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

      const result = await dishService.create(
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async getMineById(req: Request<{ dishId: string }>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const dishId = parseDishId(req.params.dishId);
      if (dishId === null) {
        return res.status(400).json({ error: "ID món không hợp lệ" });
      }

      const dish = await dishService.getMineById(req.user.userId, dishId);
      if (!dish) {
        return res.status(404).json({ error: "Không tìm thấy món của bạn" });
      }

      return res.json(dish);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async update(req: Request<{ dishId: string }>, res: Response) {
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

      const result = await dishService.update(
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
        await cleanupCloudinaryImage(result.oldImageUrl);
      }

      return res.json(result.dish);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async remove(req: Request<{ dishId: string }>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const dishId = parseDishId(req.params.dishId);
      if (dishId === null) {
        return res.status(400).json({ error: "ID món không hợp lệ" });
      }

      const result = await dishService.remove(req.user.userId, dishId);
      if (!result.ok) {
        return res.status(404).json({ error: "Không tìm thấy món của bạn" });
      }

      await cleanupCloudinaryImage(result.imageUrl);

      return res.json({ message: "Đã xóa món thành công" });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
  async listGlobal(req: Request, res: Response) {
    try {
      const parsed = adminGlobalDishesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const { search, page, pageSize } = parsed.data;
      const result = await dishService.listGlobalForAdmin(
        search,
        page,
        pageSize,
      );
      return res.json(result);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async getGlobalById(req: Request<{ dishId: string }>, res: Response) {
    try {
      const dishId = parseDishId(req.params.dishId);
      if (dishId === null) {
        return res.status(400).json({ error: "ID món không hợp lệ" });
      }

      const dish = await dishService.getGlobalById(dishId);
      if (!dish) {
        return res.status(404).json({ error: "Không tìm thấy món hệ thống" });
      }

      return res.json(dish);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async createGlobal(req: Request, res: Response) {
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

      const result = await dishService.createGlobal(
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async updateGlobal(req: Request<{ dishId: string }>, res: Response) {
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

      const result = await dishService.updateGlobal(
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
        await cleanupCloudinaryImage(result.oldImageUrl);
      }

      return res.json(result.dish);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async removeGlobal(req: Request<{ dishId: string }>, res: Response) {
    try {
      const dishId = parseDishId(req.params.dishId);
      if (dishId === null) {
        return res.status(400).json({ error: "ID món không hợp lệ" });
      }

      const result = await dishService.removeGlobal(dishId);
      if (!result.ok) {
        return res.status(404).json({ error: "Không tìm thấy món hệ thống" });
      }

      await cleanupCloudinaryImage(result.imageUrl);

      return res.json({ message: "Đã xóa món hệ thống thành công" });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
};
