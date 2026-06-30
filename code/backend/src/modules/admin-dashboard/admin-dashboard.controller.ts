import { Request, Response } from "express";
import { adminDashboardService } from "./admin-dashboard.service";

export const adminDashboardController = {
  async getStats(req: Request, res: Response) {
    try {
      const stats = await adminDashboardService.getStats();
      return res.json(stats);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
};