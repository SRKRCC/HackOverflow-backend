import express from "express";
import memberRoutes from "./routes/memberRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import { fetchLeaderboard } from './controllers/leaderboardController.js';

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());

app.use('/api', memberRoutes);

app.use("/api", teamRoutes);
app.use('/api', leaderboardRoutes);

// Initialize leaderboard cache
fetchLeaderboard();

// Refresh leaderboard cache every 5 minutes
setInterval(fetchLeaderboard, 5 * 60 * 1000);

app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
});