import { Router } from "express";
import { getDetails } from "../../controllers/adminControllers/teamControllers.js";
import { getTeamTasks, submitTaskForReview, getTaskById } from "../../controllers/teamControllers/taskController.js";
import { getProblemStatement, getImages } from "../../controllers/teamControllers/generalController.js";
import { logger } from "../../middlewares/logger.js";
import { authenticateTeam } from "../../middlewares/authenticateTeam.js";
import { teamLogout } from "../../controllers/authControllers.js";
const router = Router();

router.use(logger);

// Team details
router.get("/team", authenticateTeam, getDetails);

// Task-related routes for teams
router.get("/tasks", authenticateTeam, getTeamTasks); // Get all tasks for team
router.get("/tasks/:id", authenticateTeam, getTaskById); // Get specific task
router.post("/tasks/:id/submit", authenticateTeam, submitTaskForReview); // Submit task for review

router.get("/problem-statement", authenticateTeam, getProblemStatement);
router.get("/gallery", authenticateTeam, getImages);

router.post("/logout", authenticateTeam, teamLogout);

export default router;
