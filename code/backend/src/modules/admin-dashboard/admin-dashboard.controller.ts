import { Request, Response } from "express";
import { sendServerError } from "../../utils/http.util";
import { adminDashboardService } from "./admin-dashboard.service";

export const adminDashboardController = {
  async getStats(req: Request, res: Response) {
    try {
      const stats = await adminDashboardService.getStats();
      return res.json(stats);
    } catch (error) {
      return sendServerError(res, error);
    }
  },
};