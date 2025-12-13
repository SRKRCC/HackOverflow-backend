import express from 'express';
import { getAllMembers, getMemberFilters } from '../../controllers/adminControllers/memberControllers.js';
import { authenticateAdmin } from '../../middlewares/authenticateAdmin.js';

const router = express.Router();

router.use(authenticateAdmin);

router.get('/', getAllMembers);

router.get('/filters', getMemberFilters);

export default router;
