import { Request, Response } from "express";
import { sendError } from "../../utils/http.util";
import { suggestPlanService } from "./suggest-plan.service";
import {
  createSuggestPlanBodySchema,
  listSuggestPlansQuerySchema,
  publishSuggestPlanBodySchema,
  suggestPlanDayParamsSchema,
  suggestPlanIdParamSchema,
  updateSuggestPlanBodySchema,
  listPublicSuggestPlansQuerySchema,
  suggestPlanMealIdParamSchema,
  applySuggestPlanBodySchema,
} from "./suggest-plan.validation";
import { suggestPlanApplyService } from "./suggest-plan-apply.service";
import { destroyCloudinaryImage } from "../../config/cloudinary";

// Lấy userId admin từ token đã xác thực
function getAdminUserId(req: Request): number | null {
  return req.user?.userId ?? null;
}

export const suggestPlanController = {
  // ===== Admin: quản lý gói gợi ý =====

  // Danh sách gói: tìm kiếm + phân trang + sắp xếp
  async list(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const parsed = listSuggestPlansQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Query không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const { search, page, pageSize, sort } = parsed.data;
      const result = await suggestPlanService.list(
        search,
        page,
        pageSize,
        sort,
      );
      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Tạo gói mới, mặc định 1 ngày trống
  async create(req: Request, res: Response) {
    try {
      const userId = getAdminUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const parsed = createSuggestPlanBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const result = await suggestPlanService.create(
        userId,
        parsed.data.name,
        parsed.data.dayCount,
      );

      return res.status(201).json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Chi tiết 1 gói, gồm mọi ngày
  async getById(req: Request<{ id: string }>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const parsed = suggestPlanIdParamSchema.safeParse({ id: req.params.id });
      if (!parsed.success) {
        return res.status(400).json({
          error: "Id không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const plan = await suggestPlanService.getDetail(parsed.data.id);

      return res.json(plan);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Sửa tên/ mô tả/ ảnh gói, xóa ảnh cũ nếu thay
  async update(req: Request<{ id: string }>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const idParsed = suggestPlanIdParamSchema.safeParse({
        id: req.params.id,
      });
      if (!idParsed.success) {
        return res.status(400).json({
          error: "Id không hợp lệ",
          details: idParsed.error.issues,
        });
      }

      const newImageUrl =
        req.file && "path" in req.file ? (req.file.path as string) : undefined;

      const rawDescription = req.body?.description;
      const description =
        rawDescription === undefined
          ? undefined
          : rawDescription === "" || rawDescription === "null"
            ? null
            : String(rawDescription);

      const bodyParsed = updateSuggestPlanBodySchema.safeParse({
        ...(req.body?.name !== undefined
          ? { name: String(req.body.name) }
          : {}),
        ...(description !== undefined ? { description } : {}),
        ...(newImageUrl
          ? { imageUrl: newImageUrl }
          : req.body?.imageUrl !== undefined
            ? {
                imageUrl:
                  req.body.imageUrl === "null"
                    ? null
                    : String(req.body.imageUrl),
              }
            : {}),
      });

      if (!bodyParsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: bodyParsed.error.issues,
        });
      }

      const result = await suggestPlanService.updateMetadata(
        idParsed.data.id,
        bodyParsed.data,
      );

      if (
        newImageUrl &&
        result.oldImageUrl &&
        result.oldImageUrl !== newImageUrl
      ) {
        await destroyCloudinaryImage(result.oldImageUrl);
      }

      return res.json(result.plan);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Xóa 1 gói gợi ý
  async remove(req: Request<{ id: string }>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const parsed = suggestPlanIdParamSchema.safeParse({ id: req.params.id });
      if (!parsed.success) {
        return res.status(400).json({
          error: "Id không hợp lệ",
          details: parsed.error.issues,
        });
      }

      await suggestPlanService.remove(parsed.data.id);

      return res.json({ message: "Đã xóa thực đơn gợi ý." });
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Bật/tắt công khai gói
  async publish(req: Request<{ id: string }>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const idParsed = suggestPlanIdParamSchema.safeParse({
        id: req.params.id,
      });
      if (!idParsed.success) {
        return res.status(400).json({
          error: "Id không hợp lệ",
          details: idParsed.error.issues,
        });
      }

      const bodyParsed = publishSuggestPlanBodySchema.safeParse(req.body);
      if (!bodyParsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: bodyParsed.error.issues,
        });
      }

      const result = await suggestPlanService.publish(
        idParsed.data.id,
        bodyParsed.data.isPublic,
      );

      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Thêm 1 ngày trống vào cuối gói
  async addDay(req: Request<{ id: string }>, res: Response) {
    try {
      const userId = getAdminUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const parsed = suggestPlanIdParamSchema.safeParse({ id: req.params.id });
      if (!parsed.success) {
        return res.status(400).json({
          error: "Id không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const result = await suggestPlanService.addDay(parsed.data.id, userId);

      return res.status(201).json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Xóa 1 ngày khỏi gói theo dayIndex
  async removeDay(
    req: Request<{ id: string; dayIndex: string }>,
    res: Response,
  ) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const parsed = suggestPlanDayParamsSchema.safeParse({
        id: req.params.id,
        dayIndex: req.params.dayIndex,
      });
      if (!parsed.success) {
        return res.status(400).json({
          error: "Tham số không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const result = await suggestPlanService.removeDay(
        parsed.data.id,
        parsed.data.dayIndex,
      );

      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Dinh dưỡng đầy đủ 1 ngày trong gói
  async getDayNutrients(
    req: Request<{ id: string; dayIndex: string }>,
    res: Response,
  ) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const parsed = suggestPlanDayParamsSchema.safeParse({
        id: req.params.id,
        dayIndex: req.params.dayIndex,
      });
      if (!parsed.success) {
        return res.status(400).json({
          error: "Tham số không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const result = await suggestPlanService.getDayNutrients(
        parsed.data.id,
        parsed.data.dayIndex,
      );

      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // ===== Public: user xem gói đang công khai =====

  // Danh sách gói công khai: tìm kiếm + phân trang
  async listPublic(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const parsed = listPublicSuggestPlansQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Query không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const { search, page, pageSize, sort } = parsed.data;
      const result = await suggestPlanService.listPublic(
        search,
        page,
        pageSize,
        sort,
      );
      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Chi tiết 1 gói công khai cho user xem
  async getPublicById(req: Request<{ id: string }>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const parsed = suggestPlanIdParamSchema.safeParse({ id: req.params.id });
      if (!parsed.success) {
        return res.status(400).json({
          error: "Id không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const plan = await suggestPlanService.getPublicDetail(parsed.data.id);

      return res.json(plan);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Dinh dưỡng 1 bữa trong gói công khai
  async getPublicMealNutrients(
    req: Request<{ mealId: string }>,
    res: Response,
  ) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const parsed = suggestPlanMealIdParamSchema.safeParse({
        mealId: req.params.mealId,
      });
      if (!parsed.success) {
        return res.status(400).json({
          error: "Meal id không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const result = await suggestPlanService.getPublicMealNutrients(
        parsed.data.mealId,
      );
      if (!result) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy bữa trong gợi ý công khai." });
      }

      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // ===== Apply: áp dụng gói vào ngày thật của user =====

  // Áp dụng cả gói/ 1 ngày/ 1 bữa vào lịch thật
  async applySuggestPlan(req: Request<{ id: string }>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const idParsed = suggestPlanIdParamSchema.safeParse({
        id: req.params.id,
      });
      if (!idParsed.success) {
        return res.status(400).json({
          error: "Id không hợp lệ",
          details: idParsed.error.issues,
        });
      }

      const bodyParsed = applySuggestPlanBodySchema.safeParse(req.body);
      if (!bodyParsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: bodyParsed.error.issues,
        });
      }

      const result = await suggestPlanApplyService.apply(
        req.user.userId,
        idParsed.data.id,
        bodyParsed.data,
      );

      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },
};
