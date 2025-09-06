import express from "express";
import memberRoutes from "./routes/memberRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import { fetchLeaderboard } from './controllers/leaderboardController.js';
import taskRoutes from "./routes/taskRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/members", memberRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/leaderboards", leaderboardRoutes);
app.use("/api/tasks", taskRoutes);


// Initialize leaderboard cache
fetchLeaderboard();

// Refresh leaderboard cache every 5 minutes
setInterval(fetchLeaderboard, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});
