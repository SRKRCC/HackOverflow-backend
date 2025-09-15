import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { PrismaClient } from "../../lib/generated/prisma/index.js";
import type { Request, Response } from "express";

dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.SECRET_KEY;

if (!JWT_SECRET) {
  throw new Error("SECRET_KEY environment variable is not defined");
}

const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    let user: any = null;
    let role: "team" | "admin" | null = null;

    // 1. Try Admin login
    user = await prisma.admin.findUnique({ where: { email: username } });
    if (user && user.password === password) {
      role = "admin";
    } else {
      // 2. Try Team login
      user = await prisma.team.findFirst({ where: { scc_id: username } });
      if (user && user.scc_password === password) {
        role = "team";
      }
    }


    if (!role) {
      return res.status(400).json({ error: "Invalid credentials" });
    }


    const payload =
      role === "team"
        ? { teamId: user.id, role: "team" }
        : { adminId: user.id, role: "admin" };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });

    const cookieName = role === "admin" ? "admin_token" : "team_token";

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 12 * 60 * 60 * 1000, // 12h
    });

    res.json({ message: `${role} login successful`, role });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default login;
