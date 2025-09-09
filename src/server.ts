console.log('Starting server setup...');

import express from "express";
import memberRoutes from "./routes/memberRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import registerRoutes from './routes/registerRoutes.js';
import { fetchLeaderboard } from './controllers/leaderboardController.js';
import taskRoutes from "./routes/taskRoutes.js";

const app = express();
const PORT = process.env.PORT || 3001;

console.log(`Attempting to start server on port ${PORT}`);

app.use(express.json());

// Add global request logging
app.use((req, res, next) => {
  console.log(`INCOMING REQUEST: ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

console.log('Global logging middleware added');

app.use("/api/members", memberRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/leaderboards", leaderboardRoutes);
app.use("/api/tasks", taskRoutes);
app.use('/api/registerTeam', registerRoutes);
console.log('Register routes mounted at /api/registerTeam');

// Add a simple test route
app.get('/test-server', (req, res) => {
  console.log('Server test route hit');
  res.send('Server is working');
});

// Initialize leaderboard cache
fetchLeaderboard();

// Refresh leaderboard cache every 5 minutes
setInterval(fetchLeaderboard, 5 * 60 * 1000);

// Function to start server with port retry
const startServer = (port: number) => {
  app.listen(port, () => {
    console.log(`✅ Server successfully started on http://localhost:${port}`);
  }).on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is busy. Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('❌ Server failed to start:', err.message);
    }
  });
};

// Start server on initial PORT (ensure it's a number)
const initialPort = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
startServer(initialPort);
