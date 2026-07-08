import "express";

// Thêm thuộc tính 'user' vào cấu trúc Request
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: number;
      role: string;
    };
  }
}