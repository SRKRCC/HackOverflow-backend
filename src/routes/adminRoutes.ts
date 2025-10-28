import express from 'express';

import adminTeamRoutes from './adminRoutes/adminTeamRoutes.js';
import leaderboardRoutes from './adminRoutes/leaderboardRoutes.js';
import taskRoutes from './adminRoutes/taskRoutes.js';
import psRoutes from './adminRoutes/psRoutes.js';
import announcementRoutes from './adminRoutes/announcementRoutes.js';
import galleryRoutes from './adminRoutes/galleryRoutes.js';
import { adminLogout } from '../controllers/authControllers.js';
import { authenticateAdmin } from '../middlewares/authenticateAdmin.js';

const router = express.Router();

router.use('/teams', adminTeamRoutes);
router.use('/leaderboards', leaderboardRoutes);
router.use('/tasks', taskRoutes);
router.use('/problem-statements', psRoutes);
router.use('/announcements', announcementRoutes);
router.use('/gallery', galleryRoutes);
router.post('/logout', authenticateAdmin, adminLogout);

export default router;