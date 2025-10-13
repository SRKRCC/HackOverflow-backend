import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwtService.js";

export interface JwtPayload {
  adminId?: number;
  role: "admin";
}

export interface CustomRequest extends Request {
  user?: JwtPayload;
}

const JWT_SECRET = process.env.SECRET_KEY;

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

export const authenticateAdmin = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  //Check both cookies (admin or team)
  if (req.cookies?.admin_token) {
    token = req.cookies.admin_token;
  }

  // Check Authorization header if cookies missing
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    const decoded = verifyToken(token) as JwtPayload;

    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "No rights to access this route" });
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired, please log in again" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};
