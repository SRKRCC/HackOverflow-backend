import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import teamRoutes from "./routes/teamRoutes/teamRoutes.js";
import leaderboardRoutes from './routes/adminRoutes/leaderboardRoutes.js';
import { fetchLeaderboard } from './controllers/adminControllers/leaderboardController.js';
import taskRoutes from "./routes/adminRoutes/taskRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import psRoutes from "./routes/adminRoutes/psRoutes.js"
import adminTeamRoutes from "./routes/adminRoutes/adminTeamRoutes.js";
import announcementRouter from "./routes/adminRoutes/announcementRoutes.js";
import galleryRouter from "./routes/adminRoutes/galleryRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,                          
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/hello", (req, res) => {
  res.status(200).json({ message: "Hello, HackOverflow Server is running!" });
});

// app.use("/api/members", memberRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/admin/teams", adminTeamRoutes);
app.use("/api/leaderboards", leaderboardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/problem-statements", psRoutes);
app.use("/api/admin/announcements", announcementRouter);
app.use("/api/admin/gallery" , galleryRouter) ;

// Initialize leaderboard cache
fetchLeaderboard();

// Refresh leaderboard cache every 5 minutes
setInterval(fetchLeaderboard, 5 * 60 * 1000);

// Export the app for Lambda
export default app;

// Only start the server if running directly (not in Lambda)
if (process.env.AWS_LAMBDA_FUNCTION_NAME === undefined) {
  app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
  });
}
