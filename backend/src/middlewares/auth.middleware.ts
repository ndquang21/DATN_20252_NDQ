import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {  //ko có authHeader || sai định dạng
    return res.status(401).json({ error: "Vui lòng đăng nhập" });
  }

  const token = authHeader.split(" ")[1]; // split chuỗi lấy ra token

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string); //check
    req.user = decoded as { userId: number; role: string };
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Token không hợp lệ" });
  }
};

// Hàm lọc phân quyền
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {

    //check 1
    if (!req.user) {
      return res.status(401).json({ error: "Vui lòng đăng nhập" });
    }

    //check 2
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Bạn không có quyền truy cập" });
    }

    return next();
  };
};