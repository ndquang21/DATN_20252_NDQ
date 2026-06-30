import { Request, Response } from "express";
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

function adminUserId(req: Request): number | null {
  return req.user?.userId ?? null;
}

export const suggestPlanController = {
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

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

      const result = await suggestPlanService.getPublicDetail(parsed.data.id);
      if (!result.ok) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy thực đơn gợi ý." });
      }

      return res.json(result.plan);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

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
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async applyPublic(req: Request<{ id: string }>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const idParsed = suggestPlanIdParamSchema.safeParse({ id: req.params.id });
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

      const result = await suggestPlanApplyService.applyPublic(
        req.user.userId,
        idParsed.data.id,
        bodyParsed.data,
      );

      if (!result.ok) {
        const map: Record<
          typeof result.reason,
          { status: number; error: string }
        > = {
          not_found: {
            status: 404,
            error: "Không tìm thấy thực đơn gợi ý.",
          },
          profile_incomplete: {
            status: 400,
            error: "Cần hoàn thiện hồ sơ (TDEE) trước khi áp dụng.",
          },
          invalid_day: { status: 400, error: "Ngày mẫu không hợp lệ." },
          invalid_meal: { status: 400, error: "Bữa mẫu không hợp lệ." },
        };
        const m = map[result.reason];
        return res.status(m.status).json({ error: m.error });
      }

      return res.json(result.data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },  async list(req: Request, res: Response) {
    try {
      const userId = adminUserId(req);
      if (!userId) {
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
      const result = await suggestPlanService.list(search, page, pageSize, sort);
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
      const userId = adminUserId(req);
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async getById(req: Request<{ id: string }>, res: Response) {
    try {
      const userId = adminUserId(req);
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

      const result = await suggestPlanService.getDetail(parsed.data.id, userId);

      if (!result.ok) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy thực đơn gợi ý." });
      }

      return res.json(result.plan);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async update(req: Request<{ id: string }>, res: Response) {
    try {
      const userId = adminUserId(req);
      if (!userId) {
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
        ...(req.body?.name !== undefined ? { name: String(req.body.name) } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(newImageUrl
          ? { imageUrl: newImageUrl }
          : req.body?.imageUrl !== undefined
            ? {
                imageUrl:
                  req.body.imageUrl === "null" ? null : String(req.body.imageUrl),
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
        userId,
        bodyParsed.data,
      );

      if (!result.ok) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy thực đơn gợi ý." });
      }

      if (
        newImageUrl &&
        result.oldImageUrl &&
        result.oldImageUrl !== newImageUrl
      ) {
        await cleanupCloudinaryImage(result.oldImageUrl);
      }

      return res.json(result.plan);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async remove(req: Request<{ id: string }>, res: Response) {
    try {
      const userId = adminUserId(req);
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

      const result = await suggestPlanService.remove(parsed.data.id, userId);

      if (!result.ok) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy thực đơn gợi ý." });
      }

      return res.json({ message: "Đã xóa thực đơn gợi ý." });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async publish(req: Request<{ id: string }>, res: Response) {
    try {
      const userId = adminUserId(req);
      if (!userId) {
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
        userId,
        bodyParsed.data.isPublic,
      );

      if (!result.ok) {
        if (result.reason === "not_found") {
          return res
            .status(404)
            .json({ error: "Không tìm thấy thực đơn gợi ý." });
        }
        if (result.reason === "incomplete") {
          return res.status(400).json({
            error: "Chưa đủ ngày hoàn chỉnh để công khai.",
          });
        }
        return res
          .status(400)
          .json({ error: "Không thể cập nhật trạng thái." });
      }

      return res.json(result.result);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async addDay(req: Request<{ id: string }>, res: Response) {
    try {
      const userId = adminUserId(req);
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

      if (!result.ok) {
        if (result.reason === "not_found") {
          return res
            .status(404)
            .json({ error: "Không tìm thấy thực đơn gợi ý." });
        }
        if (result.reason === "max_days") {
          return res.status(400).json({ error: "Đã đạt tối đa 14 ngày." });
        }
        return res.status(400).json({ error: "Không thể thêm ngày." });
      }

      return res.status(201).json(result.result);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async removeDay(
    req: Request<{ id: string; dayIndex: string }>,
    res: Response,
  ) {
    try {
      const userId = adminUserId(req);
      if (!userId) {
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
        userId,
        parsed.data.dayIndex,
      );

      if (!result.ok) {
        if (result.reason === "not_found") {
          return res
            .status(404)
            .json({ error: "Không tìm thấy thực đơn gợi ý." });
        }
        if (result.reason === "min_days") {
          return res.status(400).json({ error: "Phải giữ ít nhất 1 ngày." });
        }
        if (result.reason === "invalid_day") {
          return res.status(400).json({
            error: "Ngày không tồn tại trong thực đơn này.",
          });
        }
        return res.status(400).json({ error: "Không thể xóa ngày." });
      }

      return res.json(result.result);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async getDayNutrients(
    req: Request<{ id: string; dayIndex: string }>,
    res: Response,
  ) {
    try {
      const userId = adminUserId(req);
      if (!userId) {
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
        userId,
        parsed.data.dayIndex,
      );

      if (!result.ok) {
        if (result.reason === "not_found") {
          return res
            .status(404)
            .json({ error: "Không tìm thấy thực đơn gợi ý." });
        }
        return res.status(400).json({
          error: "Ngày không tồn tại trong thực đơn này.",
        });
      }

      return res.json(result.data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
};