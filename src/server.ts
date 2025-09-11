import express from "express";
import memberRoutes from "../src/routes/memberRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Register routes
app.use("/members", memberRoutes);
app.use("/teams", teamRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/tasks", taskRoutes);
app.use("/search", searchRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
