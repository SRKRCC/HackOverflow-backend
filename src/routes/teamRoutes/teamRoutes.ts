import { Router } from "express";
import { getDetails } from "../../controllers/adminControllers/teamControllers.js";
import { validateTeamId } from "../../middlewares/validateTeamId.js";
import { logger } from "../../middlewares/logger.js";
import { authenticateTeam } from "../../middlewares/authenticateTeam.js";
const router = Router();

router.use(logger);

router.get("/:teamId", validateTeamId, authenticateTeam, getDetails);

export default router;
