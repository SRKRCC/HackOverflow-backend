import dotenv from "dotenv";
import { prisma } from "../lib/prisma.js";
import type { Request, Response } from "express";
import { verifyPasswordHash, generateToken, generatePasswordHash } from "../utils/jwtService.js";

dotenv.config();

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
          const isPasswordValid = password === user.scc_password;
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
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
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


export const teamLogout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("team_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });

    return res.status(200).json({
      message: "Logout successful",
      success: true,
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      error: "Internal server error while logging out",
      success: false,
    });
  }
};

export const adminLogout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("admin_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });

    return res.status(200).json({
      message: "Logout successful",
      success: true,
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      error: "Internal server error while logging out",
      success: false,
    });
  }
};

