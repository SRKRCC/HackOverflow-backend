import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import teamRoutes from "./routes/teamRoutes/teamRoutes.js";
import { fetchLeaderboard } from './controllers/adminControllers/leaderboardController.js';
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from './routes/adminRoutes.js';
import publicRoutes from "./routes/publicRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "https://hackoverflow.srkrcodingclub.in",
  credentials: true,                          
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/hello", (req, res) => {
  res.status(200).json({ message: "Hello, HackOverflow Server is running!" });
});

app.use("/api/teams", teamRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);

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
