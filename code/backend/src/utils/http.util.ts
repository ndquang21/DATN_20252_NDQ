import type { Response } from "express";

// Lỗi 500 (bất ngờ): log đầy đủ ở server để dev điều tra, nhưng chỉ trả
// thông điệp chung cho client — KHÔNG lộ chi tiết lỗi nội bộ (DB, stack...).
export function sendServerError(res: Response, error: unknown) {
  console.error(error);
  return res
    .status(500)
    .json({ error: "Đã có lỗi xảy ra, vui lòng thử lại sau." });
}
