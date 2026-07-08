import { Request, Response } from "express";
import { sendError } from "../../utils/http.util";
import { userService } from "./user.service";
import {
  createUserSchema,
  updateBasicInfoSchema,
  listUsersQuerySchema,
  updateTrackedNutrientsSchema,
} from "./user.validation";
import { destroyCloudinaryImage } from "../../config/cloudinary";

export const userController = {
  // ===== User: hồ sơ, mật khẩu, dinh dưỡng theo dõi, avatar =====

  // Lấy hồ sơ của chính mình
  async getMe(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const profile = await userService.getMyProfile(req.user.userId);
      return res.json(profile);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Cập nhật hồ sơ cơ thể, tự tính lại TDEE
  async updateBasicInfo(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const parseResult = updateBasicInfoSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parseResult.error.issues,
        });
      }

      const result = await userService.updateBasicInfo(
        req.user.userId,
        parseResult.data,
      );
      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Đổi mật khẩu, yêu cầu mật khẩu hiện tại
  async changePassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const { current_password, new_password, confirm_password } = req.body;
      if (!current_password || !new_password || !confirm_password) {
        return res
          .status(400)
          .json({ error: "Vui lòng điền đầy đủ thông tin" });
      }
      if (new_password !== confirm_password) {
        return res.status(400).json({ error: "Mật khẩu xác nhận không khớp" });
      }

      await userService.changePassword(req.user.userId, req.body);
      return res.json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Lấy danh sách chất dinh dưỡng đang theo dõi
  async getTrackedNutrients(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const result = await userService.getTrackedNutrients(req.user.userId);
      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Cập nhật danh sách chất dinh dưỡng theo dõi
  async updateTrackedNutrients(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const parsed = updateTrackedNutrientsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const result = await userService.updateTrackedNutrients(
        req.user.userId,
        parsed.data,
      );
      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Upload ảnh đại diện mới, xóa ảnh cũ
  async uploadAvatar(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const fileData = req.file;
      if (!fileData) {
        return res.status(400).json({ error: "Không tìm thấy file ảnh" });
      }

      const currentUser = await userService.getUserById(req.user.userId);
      await destroyCloudinaryImage(currentUser?.avatar_url);

      const avatarUrl = fileData.path;

      const updatedUser = await userService.updateAvatar(
        req.user.userId,
        avatarUrl,
      );

      return res.json({
        message: "Cập nhật ảnh đại diện thành công",
        avatar_url: updatedUser.avatar_url,
      });
    } catch (error) {
      return sendError(res, error);
    }
  },

  // ===== Admin: quản lý user khác =====

  // Danh sách user, có tìm kiếm + phân trang
  async listUsers(req: Request, res: Response) {
    try {
      const parsed = listUsersQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Query không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const { search, page, pageSize } = parsed.data;
      const result = await userService.listForAdmin(search, page, pageSize);
      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Xem chi tiết 1 user theo id
  async getUserById(req: Request<{ id: string }>, res: Response) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (Number.isNaN(userId)) {
        return res.status(400).json({ error: "Invalid id" });
      }

      const user = await userService.getUserByIdForAdmin(userId);
      if (!user) {
        return res.status(404).json({ error: "Không tìm thấy user." });
      }

      return res.json(user);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Tạo user mới
  async createUser(req: Request, res: Response) {
    try {
      const parseResult = createUserSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parseResult.error.issues,
        });
      }

      const user = await userService.createUser(parseResult.data);
      return res.status(201).json(user);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Xóa user theo id
  async remove(req: Request<{ id: string }>, res: Response) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (Number.isNaN(userId)) {
        return res.status(400).json({ error: "Invalid id" });
      }

      const deleted = await userService.remove(userId);
      return res.json(deleted);
    } catch (error) {
      return sendError(res, error);
    }
  },
};
