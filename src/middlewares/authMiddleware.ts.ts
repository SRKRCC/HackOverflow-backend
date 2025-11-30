import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export interface JwtPayload {
  teamId?: number;
  adminId?: number;
  role: "team" | "admin";
  iat?: number;
  exp?: number;
}

export interface CustomRequest extends Request {
  user?: JwtPayload;
}

const JWT_SECRET = process.env.SECRET_KEY;

export const authenticate = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  if (req.cookies?.token) {
    token = req.cookies.token;
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

  if (!JWT_SECRET) {
    throw new Error("Missing JWT_SECRET environment variable");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const authorizeRole = (role: "team" | "admin") => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: "NO rights to access the Route" });
    }
    next();
  };
};
