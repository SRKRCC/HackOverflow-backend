import { Router } from "express";
import { getDetails } from "../../controllers/adminControllers/teamControllers.js";
import { getTeamTasks, submitTaskForReview, getTaskById } from "../../controllers/teamControllers/taskController.js";
import { getProblemStatement, getImages, getAnnouncements } from "../../controllers/teamControllers/generalController.js";
import { registerTeam } from "../../controllers/teamControllers/registerController.js";
import { logger } from "../../middlewares/logger.js";
import { authenticateTeam } from "../../middlewares/authenticateTeam.js";
import { teamLogout } from "../../controllers/authControllers.js";
import { teamRegistrationUpload, handleUploadError } from "../../middlewares/uploadMiddleware.js";

const router = Router();

router.use(logger);

// Public registration route (no authentication required)
router.post("/register", teamRegistrationUpload, handleUploadError, registerTeam);

// Team details
router.get("/team", authenticateTeam, getDetails);

// Task-related routes for teams
router.get("/tasks", authenticateTeam, getTeamTasks); // Get all tasks for team
router.get("/tasks/:id", authenticateTeam, getTaskById); // Get specific task
router.post("/tasks/:id/submit", authenticateTeam, submitTaskForReview); // Submit task for review

router.get("/problem-statement", authenticateTeam, getProblemStatement);
router.get("/gallery", authenticateTeam, getImages);
router.get("/announcements", getAnnouncements);

router.post("/logout", authenticateTeam, teamLogout);

export default router;
