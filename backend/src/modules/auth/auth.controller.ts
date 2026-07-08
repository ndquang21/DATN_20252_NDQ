import { Request, Response } from "express";
import { sendServerError, sendError } from "../../utils/http.util";
import { authService } from "./auth.service";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.validation";

export const authController = {
  // Đăng ký
  async register(req: Request, res: Response) {
    try {
      //Kiểm tra dữ liệu
      const parseResult = registerSchema.safeParse(req.body);

      // Ko hợp lệ
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parseResult.error.issues,
        });
      }

      // Hợp lệ
      const result = await authService.register(parseResult.data);
      return res.status(201).json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Đăng nhập
  async login(req: Request, res: Response) {
    try {
      //Kiểm tra dữ liệu
      const parseResult = loginSchema.safeParse(req.body);

      // Ko hợp lệ
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parseResult.error.issues,
        });
      }

      // Hợp lệ
      const result = await authService.login(parseResult.data);
      return res.status(200).json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  // Đăng xuất
  async logout(req: Request, res: Response) {
    try {
      // Lấy ra refreshToken
      const { refreshToken } = req.body;
      const result = await authService.logout(refreshToken);
      return res.status(200).json(result);
    } catch (error: unknown) {
      return res.status(400).json({ error: "Logout failed" });
    }
  },

  // Refresh
  async refresh(req: Request, res: Response) {
    try {
      // Lấy ra refreshToken
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);
      return res.status(200).json(result);
    } catch (error: unknown) {
      return res.status(401).json({ error: "Refresh token không hợp lệ" });
    }
  },

  // Quên mật khẩu
  async forgotPassword(req: Request, res: Response) {
    try {
      //Kiểm tra dữ liệu
      const parsed = forgotPasswordSchema.safeParse(req.body);

      // Ko hợp lệ
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parsed.error.issues,
        });
      }

      // Hợp lệ
      const result = await authService.forgotPassword(parsed.data);
      return res.json(result);
    } catch (error) {
      return sendServerError(res, error);
    }
  },

  // Reset mật khẩu
  async resetPassword(req: Request, res: Response) {
    try {
      //Kiểm tra dữ liệu
      const parsed = resetPasswordSchema.safeParse(req.body);

      // Ko hợp lệ
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          details: parsed.error.issues,
        });
      }

      // Hợp lệ
      const result = await authService.resetPassword(parsed.data);
      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  },
};