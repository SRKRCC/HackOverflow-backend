import { Router } from "express";
import { getDetails } from "../controllers/teamControllers.js";
import { validateTeamId } from "../middlewares/validateTeamId.js";
import { logger } from "../middlewares/logger.js";
import { authenticate,authorizeRole } from "../middlewares/authMiddleware.ts.js";

const router = Router();

router.use(logger);

router.get("/:teamId", authenticate,validateTeamId, getDetails);

export default router;
