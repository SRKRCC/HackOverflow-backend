import express from 'express';
import { getLeaderboard } from '../../controllers/adminControllers/leaderboardController.js';
import { authenticateAdmin } from '../../middlewares/authenticateAdmin.js';

const router = express.Router();
router.get('/', authenticateAdmin, getLeaderboard);

export default router;