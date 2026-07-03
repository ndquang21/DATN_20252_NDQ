import { Request, Response } from "express";
import { sendServerError } from "../../utils/http.util";
import { dailyPlanService } from "./daily-plan.service";
import {
  getDailyPlanQuerySchema,
  finishMealSchema,
  createMealSchema,
  addDishSchema,
  updateDishSchema,
} from "./daily-plan.validation";

const REASON_STATUS: Record<string, { status: number; error: string }> = {
  forbidden: {
    status: 404,
    error: "Không tìm thấy bữa ăn hoặc bạn không có quyền",
  },
  dish_not_found: { status: 404, error: "Không tìm thấy món ăn" },
  not_in_meal: { status: 404, error: "Món không có trong bữa" },
  duplicate: { status: 409, error: "Món đã có trong bữa" },
  meal_type_exists: {
    status: 409,
    error: "Loại bữa này đã tồn tại trong ngày",
  },
};

export const dailyPlanController = {
  async getDailyPlan(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const parseResult = getDailyPlanQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parseResult.error.issues,
        });
      }

      const result = await dailyPlanService.getDailyPlan(
        req.user.userId,
        parseResult.data.date,
      );
      return res.json(result);
    } catch (error) {
      return sendServerError(res, error);
    }
  },

  async setMealFinished(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const mealId = Number(req.params.mealId);
      if (Number.isNaN(mealId)) {
        return res.status(400).json({ error: "mealId không hợp lệ" });
      }

      const parseResult = finishMealSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parseResult.error.issues,
        });
      }

      const result = await dailyPlanService.setMealFinished(
        req.user.userId,
        mealId,
        parseResult.data.isFinished,
      );
      if (!result) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy bữa ăn hoặc bạn không có quyền" });
      }
      return res.json(result);
    } catch (error) {
      return sendServerError(res, error);
    }
  },

  async getMealNutrients(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      }

      const mealId = Number(req.params.mealId);
      if (Number.isNaN(mealId)) {
        return res.status(400).json({ error: "mealId không hợp lệ" });
      }

      const result = await dailyPlanService.getMealNutrients(
        req.user.userId,
        mealId,
      );
      if (!result) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy bữa ăn hoặc bạn không có quyền" });
      }
      return res.json(result);
    } catch (error) {
      return sendServerError(res, error);
    }
  },

  async createMeal(req: Request, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Vui lòng đăng nhập" });

      const parsed = createMealSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error: "Dữ liệu không hợp lệ",
            details: parsed.error.issues,
          });
      }

      const result = await dailyPlanService.createMeal(req.user.userId, {
        date: parsed.data.date,
        dailyPlanId: parsed.data.dailyPlanId,
        mealType: parsed.data.mealType,
        dishId: parsed.data.dishId,
        grams: parsed.data.grams,
      });
      if (!result.ok) {
        const m = REASON_STATUS[result.reason];
        return res.status(m.status).json({ error: m.error });
      }
      return res.status(201).json({ mealId: result.mealId, plan: result.plan });
    } catch (error) {
      return sendServerError(res, error);
    }
  },

  async addDish(req: Request, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      const mealId = Number(req.params.mealId);
      if (Number.isNaN(mealId)) {
        return res.status(400).json({ error: "mealId không hợp lệ" });
      }

      const parsed = addDishSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error: "Dữ liệu không hợp lệ",
            details: parsed.error.issues,
          });
      }

      const result = await dailyPlanService.addDishToMeal(
        req.user.userId,
        mealId,
        parsed.data.dishId,
        parsed.data.grams,
      );
      if (!result.ok) {
        const m = REASON_STATUS[result.reason];
        return res.status(m.status).json({ error: m.error });
      }
      return res.json(result.plan);
    } catch (error) {
      return sendServerError(res, error);
    }
  },

  async updateDish(req: Request, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      const mealId = Number(req.params.mealId);
      const dishId = Number(req.params.dishId);
      if (Number.isNaN(mealId) || Number.isNaN(dishId)) {
        return res.status(400).json({ error: "mealId/dishId không hợp lệ" });
      }

      const parsed = updateDishSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error: "Dữ liệu không hợp lệ",
            details: parsed.error.issues,
          });
      }

      const result = await dailyPlanService.updateMealDishGrams(
        req.user.userId,
        mealId,
        dishId,
        parsed.data.grams,
      );
      if (!result.ok) {
        const m = REASON_STATUS[result.reason];
        return res.status(m.status).json({ error: m.error });
      }
      return res.json(result.plan);
    } catch (error) {
      return sendServerError(res, error);
    }
  },

  async removeDish(req: Request, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Vui lòng đăng nhập" });
      const mealId = Number(req.params.mealId);
      const dishId = Number(req.params.dishId);
      if (Number.isNaN(mealId) || Number.isNaN(dishId)) {
        return res.status(400).json({ error: "mealId/dishId không hợp lệ" });
      }

      const result = await dailyPlanService.removeMealDish(
        req.user.userId,
        mealId,
        dishId,
      );
      if (!result.ok) {
        const m = REASON_STATUS[result.reason];
        return res.status(m.status).json({ error: m.error });
      }
      return res.json(result.plan);
    } catch (error) {
      return sendServerError(res, error);
    }
  },
};