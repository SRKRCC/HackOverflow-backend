import serverless from 'serverless-http';
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import teamRoutes from "./src/routes/teamRoutes/teamRoutes.js";
import leaderboardRoutes from './src/routes/adminRoutes/leaderboardRoutes.js';
import { fetchLeaderboard } from './src/controllers/adminControllers/leaderboardController.js';
import taskRoutes from "./src/routes/adminRoutes/taskRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import psRoutes from "./src/routes/adminRoutes/psRoutes.js";
import adminTeamRoutes from "./src/routes/adminRoutes/adminTeamRoutes.js";
import announcementRouter from "./src/routes/adminRoutes/announcementRoutes.js";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'HackOverflow Backend is running' });
});

app.use("/api/teams", teamRoutes);
app.use("/api/admin/teams", adminTeamRoutes);
app.use("/api/leaderboards", leaderboardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/problem-statements", psRoutes);
app.use("/api/admin/announcements", announcementRouter);
    
fetchLeaderboard().catch(console.error);

export const handler = serverless(app);