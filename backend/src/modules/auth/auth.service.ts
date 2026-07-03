import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userRepository } from "../user/user.repository";
import { RegisterDTO, LoginDTO } from "./auth.dto";
import { prisma } from "../../config/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../../config/mail";
import { passwordResetRepository } from "./password-reset.repository";
import { ForgotPasswordDTO, ResetPasswordDTO } from "./auth.dto";

const saveRefreshToken = (userId: number, token: string, expiresAt: Date) => {
  return prisma.refreshToken.create({
    data: {
      token,
      user_id: userId,
      expires_at: expiresAt,
    },
  });
};

const parseDurationToMs = (value: string, fallbackMs: number) => {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return fallbackMs;

  const amount = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    default:
      return fallbackMs;
  }
};

// Tạo access token + refresh token cho một user, lưu refresh token vào DB.
// Dùng chung cho cả register và login.
const issueAuthTokens = async (userId: number, role: string) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error("JWT_SECRET is not set");

  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
  if (!refreshSecret) throw new Error("REFRESH_TOKEN_SECRET is not set");

  const payload = { userId, role };

  const token = jwt.sign(payload, jwtSecret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ||
      "1d") as jwt.SignOptions["expiresIn"],
  });

  const refreshExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
  const refreshToken = jwt.sign(payload, refreshSecret, {
    expiresIn: refreshExpiresIn as jwt.SignOptions["expiresIn"],
  });

  const refreshTtlMs = parseDurationToMs(
    refreshExpiresIn,
    7 * 24 * 60 * 60 * 1000,
  );
  const refreshExpiresAt = new Date(Date.now() + refreshTtlMs);
  await saveRefreshToken(userId, refreshToken, refreshExpiresAt);

  return { token, refreshToken };
};

export const authService = {
  async register(dto: RegisterDTO) {
    const existingUser = await userRepository.findByEmail(dto.email);
    if (existingUser) {
      const error = new Error("Email already exists");
      (error as Error & { statusCode?: number }).statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = await userRepository.create({
      email: dto.email,
      password: hashedPassword,
      username: dto.username,
      role: "user",
    });

    const { token, refreshToken } = await issueAuthTokens(
      newUser.user_id,
      newUser.role,
    );

    return {
      token,
      refreshToken,
      user: {
        user_id: newUser.user_id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        avatar_url: newUser.avatar_url,
      },
    };
  },

  async login(dto: LoginDTO) {
    const user = await userRepository.findByEmail(dto.email);
    if (!user) {
      const error = new Error("Email hoặc mật khẩu không chính xác");
      (error as Error & { statusCode?: number }).statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      const error = new Error("Email hoặc mật khẩu không chính xác");
      (error as Error & { statusCode?: number }).statusCode = 401;
      throw error;
    }

    const { token, refreshToken } = await issueAuthTokens(
      user.user_id,
      user.role,
    );

    return {
      token,
      refreshToken,
      user: {
        user_id: user.user_id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    };
  },

  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }

    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    return { message: "Logged out" };
  },

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }

    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!refreshSecret) {
      throw new Error("REFRESH_TOKEN_SECRET is not set");
    }

    const decoded = jwt.verify(refreshToken, refreshSecret) as {
      userId: number;
      role: string;
    };

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (!stored) {
      throw new Error("Refresh token not found");
    }

    if (stored.expires_at < new Date()) {
      throw new Error("Refresh token expired");
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not set");
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role },
      jwtSecret,
      {
        expiresIn: (process.env.JWT_EXPIRES_IN ||
          "1d") as jwt.SignOptions["expiresIn"],
      },
    );

    return { token: accessToken };
  },

  async forgotPassword(dto: ForgotPasswordDTO) {
    const user = await userRepository.findByEmail(dto.email);
    if (!user) {
      return { message: "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu." };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

    await passwordResetRepository.deleteByUserId(user.user_id);
    await passwordResetRepository.create(user.user_id, token, expiresAt);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail(user.email, resetUrl);

    return { message: "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu." };
  },

  async resetPassword(dto: ResetPasswordDTO) {
    const row = await passwordResetRepository.findByToken(dto.token);
    if (!row) {
      const error = new Error("Link không hợp lệ hoặc đã hết hạn.");
      (error as Error & { statusCode?: number }).statusCode = 400;
      throw error;
    }

    if (row.expires_at < new Date()) {
      await passwordResetRepository.deleteByToken(dto.token);
      const error = new Error("Link không hợp lệ hoặc đã hết hạn.");
      (error as Error & { statusCode?: number }).statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await prisma.user.update({
      where: { user_id: row.user_id },
      data: { password: hashedPassword },
    });

    await passwordResetRepository.deleteByUserId(row.user_id);
    await prisma.refreshToken.deleteMany({ where: { user_id: row.user_id } });

    return { message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại." };
  },
};
