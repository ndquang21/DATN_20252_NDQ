import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { userRepository } from "../user/user.repository";
import { RegisterDTO, LoginDTO, ForgotPasswordDTO, ResetPasswordDTO } from "./auth.dto";
import { appError } from "../../utils/http.util";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../../config/mail";
import { passwordResetRepository } from "./password-reset.repository";

// ======================= Helper functions ==========================
// Hàm lưu Refresh Token vào DB
const saveRefreshToken = (userId: number, token: string, expiresAt: Date) => {
  return prisma.refreshToken.create({
    data: {
      token: token,
      user_id: userId,
      expires_at: expiresAt,
    },
  });
};

//Tách chuỗi, đổi "7d" -> ms
const parseDurationToMs = (value: string, fallbackMs: number) => {
  const match = value.match(/^(\d+)([smhd])$/); //RegEx
  if (!match) return fallbackMs;

  //match[1] = số, match[2] = s/m/h/d
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

// Tạo access token + refresh token cho một user.
// Dùng chung cho cả register và login.
const issueAuthTokens = async (userId: number, role: string) => {
  
  // Kiểm tra khóa trong ENV
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret){
    throw new Error("JWT_SECRET is not set");
  }
  
  // Kiểm tra khóa trong ENV
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
  if (!refreshSecret){
    throw new Error("REFRESH_TOKEN_SECRET is not set");
  }

  // Thông tin giấu trong token
  const payload = { userId, role };

  // Tạo Access Token
  const tokenExpiresIn = process.env.JWT_EXPIRES_IN || "1d";
  const token = jwt.sign(payload, jwtSecret, {
    expiresIn: tokenExpiresIn as jwt.SignOptions["expiresIn"],
  });

  //Tạo Refresh Token
  const refreshExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
  const refreshToken = jwt.sign(payload, refreshSecret, {
    expiresIn: refreshExpiresIn as jwt.SignOptions["expiresIn"],
  });

  // Đổi chuỗi refreshExpiresIn thành ms
  const refreshTtlMs = parseDurationToMs(
    refreshExpiresIn,
    7 * 24 * 60 * 60 * 1000,
  );

  //Tính thời điểm hết hạn
  const refreshExpiresAt = new Date(Date.now() + refreshTtlMs); 

  //Lưu token
  await saveRefreshToken(userId, refreshToken, refreshExpiresAt); 

  // Trả về 2 token
  return { token, refreshToken };
};
// =================================================================


export const authService = {
  //Đăng ký
  async register(dto: RegisterDTO) {
    //Kiểm tra trùng mail
    const existingUser = await userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw appError("Email already exists", 400);
    }

    //hashpassword
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    //Tạo người dùng mới
    const newUser = await userRepository.create({
      email: dto.email,
      password: hashedPassword,
      username: dto.username,
      role: "user",
    });

    // Gọi hàm tạo 2 token cho user vừa tạo, truyền vào user id và role
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

  // Đăng nhập
  async login(dto: LoginDTO) {
    // Kiểm tra email
    const user = await userRepository.findByEmail(dto.email);
    if (!user) {
      throw appError("Email hoặc mật khẩu không chính xác", 401);
    }

    //Kiểm tra password
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw appError("Email hoặc mật khẩu không chính xác", 401);
    }

    // Gọi hàm tạo 2 token cho user vừa login, truyền vào user id và role
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

  // Đăng xuất
  async logout(refreshToken: string) {
    // Kiểm tra RefreshToken
    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }

    // Xóa RefreshToken
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    return { message: "Logged out" };
  },

  // Refresh
  async refresh(refreshToken: string) {
    // Kiểm tra RefreshToken
    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }

    // Kiểm tra khóa trong ENV
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!refreshSecret) {
      throw new Error("REFRESH_TOKEN_SECRET is not set");
    }

    // Giải mã ra userId và role
    const decoded = jwt.verify(refreshToken, refreshSecret) as {
      userId: number;
      role: string;
    };

    // Kiểm tra Refresh Token trong DB
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (!stored) {
      throw new Error("Refresh token not found");
    }
    if (stored.expires_at < new Date()) {
      throw new Error("Refresh token expired");
    }

    // Kiểm tra khóa trong ENV
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not set");
    }

    // Thông tin giấu trong token
    const { userId, role } = decoded; 
    const payload = { userId, role };

    // Tạo Access Token
    const accessToken = jwt.sign( payload, jwtSecret,{
        expiresIn: (process.env.JWT_EXPIRES_IN ||"1d") as jwt.SignOptions["expiresIn"],
      },
    );

    return { token: accessToken };
  },

  
  // Quên mật khẩu
  async forgotPassword(dto: ForgotPasswordDTO) {
    // Kiểm tra email để lấy ra user
    const user = await userRepository.findByEmail(dto.email);
    if (!user) {
      return { message: "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu." };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

    // Xóa các mã reset mật khẩu cũ của user này (nếu có) trong DB
    await passwordResetRepository.deleteByUserId(user.user_id);
    // Tạo token mới vào DB
    await passwordResetRepository.create(user.user_id, token, expiresAt);
    
    // Tạo link FE
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    // Gửi mail
    await sendPasswordResetEmail(user.email, resetUrl);

    return { message: "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu." };
  },


  //Reset mật khẩu
  async resetPassword(dto: ResetPasswordDTO) {
    // Kiểm tra token có hợp lệ?
    const row = await passwordResetRepository.findByToken(dto.token);
    if (!row) {
      throw appError("Link không hợp lệ hoặc đã hết hạn.", 400);
    }
    if (row.expires_at < new Date()) {
      await passwordResetRepository.deleteByToken(dto.token);
      throw appError("Link không hợp lệ hoặc đã hết hạn.", 400);
    }

    // hashpassword
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Cập nhật mật khẩu mới cho user
    await prisma.user.update({
      where: { user_id: row.user_id },
      data: { password: hashedPassword },
    });

    // Xóa mã reset vừa sử dụng
    await passwordResetRepository.deleteByUserId(row.user_id);
    // Xóa Refresh token của user/ đăng xuất khỏi tất cả thiết bị
    await prisma.refreshToken.deleteMany({ where: { user_id: row.user_id } });

    return { message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại." };
  },
};