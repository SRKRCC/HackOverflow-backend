import { Router } from "express";
import { getDetails } from "../../controllers/adminControllers/teamControllers.js";
import { getTeamTasks, submitTaskForReview, getTaskById } from "../../controllers/teamControllers/taskController.js";
import { validateTeamId } from "../../middlewares/validateTeamId.js";
import { logger } from "../../middlewares/logger.js";
import { authenticateTeam } from "../../middlewares/authenticateTeam.js";
const router = Router();

router.use(logger);

// Team details
router.get("/", authenticateTeam, getDetails);

// Task-related routes for teams
router.get("/:teamId/tasks", validateTeamId, authenticateTeam, getTeamTasks); // Get all tasks for team
router.get("/:teamId/tasks/:id", validateTeamId, authenticateTeam, getTaskById); // Get specific task
router.post("/:teamId/tasks/:id/submit", validateTeamId, authenticateTeam, submitTaskForReview); // Submit task for review

export default router;
