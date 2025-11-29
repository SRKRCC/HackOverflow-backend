import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import teamRoutes from "./routes/teamRoutes/teamRoutes.js";
import { fetchLeaderboard } from './controllers/adminControllers/leaderboardController.js';
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from './routes/adminRoutes.js';
import publicRoutes from "./routes/publicRoutes.js";
import { connectPrisma } from './lib/prisma.js';

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

app.use("/api/teams", teamRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);


async function initApp() {
  try {
    await connectPrisma();
    await fetchLeaderboard();
    setInterval(fetchLeaderboard, 5 * 60 * 1000);
  } catch (err) {
    console.error('Failed to initialize app due to DB connectivity issues:', err);
    process.exit(1);
  }
}
initApp();

export default app;

if (process.env.AWS_LAMBDA_FUNCTION_NAME === undefined) {
  app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
  });
}
