import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.SECRET_KEY;

if (!JWT_SECRET) {
  throw new Error("SECRET_KEY environment variable is not defined");
}

export const generatePasswordHash = (password: string): string => {
  return jwt.sign({ password }, JWT_SECRET as string);
};

export const verifyPasswordHash = (hashedPassword: string): string => {
  const decoded = jwt.verify(hashedPassword, JWT_SECRET as string);
  if (typeof decoded === "string") {
    return decoded;
  } else if (decoded && typeof decoded === "object" && "password" in decoded) {
    return (decoded as { password: string }).password;
  }
  throw new Error("Invalid token payload");
};

export const generateToken = (payload: string | object | Buffer, expiresIn: string | number = "12h"): string => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as SignOptions);
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET as string);
};
