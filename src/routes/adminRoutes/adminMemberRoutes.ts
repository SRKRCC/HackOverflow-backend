import express from 'express';
import { getAllMembers, getMemberFilters } from '../../controllers/adminControllers/memberControllers.js';
import { authenticateAdmin } from '../../middlewares/authenticateAdmin.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateAdmin);

// Get all members with optional filters
router.get('/', getAllMembers);

// Get filter options
router.get('/filters', getMemberFilters);

export default router;
