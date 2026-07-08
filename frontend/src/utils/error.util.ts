// Thông báo lỗi do server trả về nằm ở err.response.data.error;
// không tìm thấy thì trả về câu dự phòng (fallback).
export function parseApiError(err: unknown, fallback: string): string {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "data" in err.response &&
    err.response.data &&
    typeof err.response.data === "object" &&
    "error" in err.response.data &&
    typeof err.response.data.error === "string"
  ) {
    return err.response.data.error;
  }
  return fallback;
}