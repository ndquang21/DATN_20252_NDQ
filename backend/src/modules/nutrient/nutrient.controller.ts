import { Request, Response } from "express";
import { sendServerError } from "../../utils/http.util";
import { nutrientService } from "./nutrient.service";
import {
  createNutrientBodySchema,
  updateNutrientBodySchema,
} from "./nutrient.validation";

export const nutrientController = {
  async list(_req: Request, res: Response) {
    try {
      const result = await nutrientService.list();
      return res.json(result);
    } catch (error) {
      return sendServerError(res, error);
    }
  },

  async create(req: Request, res: Response) {
    try {
      const parsed = createNutrientBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const result = await nutrientService.create(
        parsed.data.name,
        parsed.data.unit,
      );

      if (!result.ok) {
        if (result.reason === "duplicate_name") {
          return res.status(409).json({ error: "Tên chất đã tồn tại." });
        }
        return res.status(400).json({ error: "Không thể tạo chất dinh dưỡng." });
      }

      return res.status(201).json(result.nutrient);
    } catch (error) {
      return sendServerError(res, error);
    }
  },

  async update(req: Request<{ id: string }>, res: Response) {
    try {
      const nutrientId = parseInt(req.params.id, 10);
      if (Number.isNaN(nutrientId)) {
        return res.status(400).json({ error: "Invalid id" });
      }

      const parsed = updateNutrientBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const result = await nutrientService.update(
        nutrientId,
        parsed.data.name,
        parsed.data.unit,
      );

      if (!result.ok) {
        if (result.reason === "not_found") {
          return res.status(404).json({ error: "Không tìm thấy chất dinh dưỡng." });
        }
        if (result.reason === "locked") {
          return res.status(403).json({
            error: "Không thể sửa macro hệ thống (Calories, Protein, Carbohydrate, Fat).",
          });
        }
        if (result.reason === "duplicate_name") {
          return res.status(409).json({ error: "Tên chất đã tồn tại." });
        }
        return res.status(400).json({ error: "Không thể cập nhật." });
      }

      return res.json(result.nutrient);
    } catch (error) {
      return sendServerError(res, error);
    }
  },

  async remove(req: Request<{ id: string }>, res: Response) {
    try {
      const nutrientId = parseInt(req.params.id, 10);
      if (Number.isNaN(nutrientId)) {
        return res.status(400).json({ error: "Invalid id" });
      }

      const result = await nutrientService.remove(nutrientId);

      if (!result.ok) {
        if (result.reason === "not_found") {
          return res.status(404).json({ error: "Không tìm thấy chất dinh dưỡng." });
        }
        if (result.reason === "locked") {
          return res.status(403).json({
            error: "Không thể xóa macro hệ thống (Calories, Protein, Carbohydrate, Fat).",
          });
        }
        return res.status(400).json({ error: "Không thể xóa." });
      }

      return res.json(result.nutrient);
    } catch (error) {
      return sendServerError(res, error);
    }
  },
};
