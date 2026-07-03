import { Request, Response } from "express";
import { sendServerError } from "../../utils/http.util";
import { authService } from "./auth.service";
import { registerSchema, loginSchema } from "./auth.validation";
import { forgotPasswordSchema, resetPasswordSchema} from "./auth.validation";

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parseResult.error.issues,
        });
      }

      const result = await authService.register(parseResult.data);
      return res.status(201).json(result);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const statusCode =
          (error as Error & { statusCode?: number }).statusCode || 400;
        return res.status(statusCode).json({ error: error.message });
      }
      return res.status(400).json({ error: "Bad Request" });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parseResult.error.issues,
        });
      }

      const result = await authService.login(parseResult.data);
      return res.status(200).json(result);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const statusCode =
          (error as Error & { statusCode?: number }).statusCode || 401;
        return res.status(statusCode).json({ error: error.message });
      }
      return res.status(401).json({ error: "Unauthorized" });
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.logout(refreshToken);
      return res.status(200).json(result);
    } catch (error: unknown) {
      return res.status(400).json({ error: "Logout failed" });
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);
      return res.status(200).json(result);
    } catch (error: unknown) {
      return res.status(401).json({ error: "Refresh token không hợp lệ" });
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const result = await authService.forgotPassword(parsed.data);
      return res.json(result);
    } catch (error) {
      return sendServerError(res, error);
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parsed.error.issues,
        });
      }

      const result = await authService.resetPassword(parsed.data);
      return res.json(result);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const statusCode =
          (error as Error & { statusCode?: number }).statusCode || 400;
        return res.status(statusCode).json({ error: error.message });
      }
      return res.status(400).json({ error: "Bad Request" });
    }
  },
};
