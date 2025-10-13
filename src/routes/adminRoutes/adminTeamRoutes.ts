import { Router } from "express";
import { getDetails, getAllTeams } from "../../controllers/adminControllers/teamControllers.js";
import { authenticateAdmin } from "../../middlewares/authenticateAdmin.js";
import { validateTeamId } from "../../middlewares/validateTeamId.js";
import { logger } from "../../middlewares/logger.js";

const router = Router();

router.use(logger);

// Admin routes
router.get("/", authenticateAdmin, getAllTeams);
router.get("/:teamId", validateTeamId, authenticateAdmin, getDetails);

export default router;