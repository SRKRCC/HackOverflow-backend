import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import memberRoutes from "./routes/memberRoutes.js";
import teamRoutes from "./routes/teamRoutes/teamRoutes.js";
import leaderboardRoutes from './routes/adminRoutes/leaderboardRoutes.js';
import { fetchLeaderboard } from './controllers/adminControllers/leaderboardController.js';
import taskRoutes from "./routes/adminRoutes/taskRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "http://localhost:5173", // Replace this with your actual frontend URL
  credentials: true,                          
}));

app.use(express.json());
app.use(cookieParser());

// app.use("/api/members", memberRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/leaderboards", leaderboardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);

// Initialize leaderboard cache
fetchLeaderboard();

// Refresh leaderboard cache every 5 minutes
setInterval(fetchLeaderboard, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});
