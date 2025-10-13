import dotenv from "dotenv";
import { PrismaClient } from "../../lib/generated/prisma/index.js";
import type { Request, Response } from "express";
import { verifyPasswordHash, generateToken, generatePasswordHash } from "../utils/jwtService.js";

dotenv.config();

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  const { role, username, password } = req.body;

  if (!role || !username || !password) {
    return res.status(400).json({ error: "Username, and password are required" });
  }

  try {
    let user: any = null;
    let userRole: "team" | "admin" | null = null;

    if (role === "admin") {
      user = await prisma.admin.findUnique({ where: { email: username } });
      if (user) {
        try {
          // Verify the hashed password using bcrypt
          const isPasswordValid = await verifyPasswordHash(password, user.password);
          if (isPasswordValid) {
            userRole = "admin";
          }
        } catch (error) {
          return res.status(500).json({ error: "Internal server error, Please try again" });
        }
      }
    } else {
      user = await prisma.team.findFirst({ where: { scc_id: username } });
      if (user && user.scc_password) {
        try {
          // Verify the hashed password using bcrypt
          const isPasswordValid = await verifyPasswordHash(password, user.scc_password);
          if (isPasswordValid) {
            userRole = "team";
          }
        } catch (error) {
          return res.status(500).json({ error: "Internal server error, Please try again" });
        }
      }
    }

    if (!user || !userRole) {
      return res.status(400).json({ error: "No existing User, Please enter valid credentials" });
    }

    const payload =
      userRole === "team"
        ? { teamId: user.id, role: "team" }
        : { adminId: user.id, role: "admin" };

    const token = generateToken(payload, "12h");

    const cookieName = role === "admin" ? "admin_token" : "team_token";

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 12 * 60 * 60 * 1000, // 12h
    });

    res.json({
      message: `${userRole} login successful`,
      role: userRole,
      userID: user.id,
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
