import type { Response } from "express";

// Tạo lỗi kèm statusCode (vd sai mật khẩu → 400). Service ném lỗi này
// controller bắt bằng sendError() trả status + message cho client
export function appError(message: string, statusCode: number): Error {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

// Lỗi 500: trả thông điệp chung cho client
export function sendServerError(res: Response, error: unknown) {
  console.error(error);
  return res
    .status(500)
    .json({ error: "Đã có lỗi xảy ra, vui lòng thử lại sau." });
}

// Lỗi xác định (service gắn statusCode, vd sai mật khẩu → 401): trả status + message cho client
// Lỗi bát ngờ (không có statusCode, vd DB lỗi) → 500 chung
export function sendError(res: Response, error: unknown) {
  if (
    error instanceof Error &&
    typeof (error as Error & { statusCode?: number }).statusCode === "number"
  ) {
    const { statusCode } = error as Error & { statusCode: number };
    return res.status(statusCode).json({ error: error.message });
  }
  return sendServerError(res, error);
}


