import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwtService.js";
import { getAdminById } from "../services/adminService.js";

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

  if (req.cookies?.admin_token) {
    token = req.cookies.admin_token;
  }

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

    if (!decoded.adminId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    void (async () => {
      try {
        const admin = await getAdminById(decoded.adminId || -1);
        if (!admin) {
          res.status(404).json({ error: "Admin not found" });
          return;
        }
        req.user = decoded;
        next();
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to verify admin" });
      }
    })();

    return;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired, please log in again" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};
