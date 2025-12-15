import { Router } from "express";
import { getDetails } from "../../controllers/adminControllers/teamControllers.js";
import { getTeamTasks, submitTaskForReview, getTaskById } from "../../controllers/teamControllers/taskController.js";
import { getProblemStatement, getImages, getAnnouncements, getGeneralInfo, updateGeneralInfo } from "../../controllers/teamControllers/generalController.js";
import { registerTeam } from "../../controllers/teamControllers/registerController.js";
import { logger } from "../../middlewares/logger.js";
import { authenticateTeam } from "../../middlewares/authenticateTeam.js";
import { teamLogout } from "../../controllers/authControllers.js";

const router = Router();

router.use(logger);

router.post("/register", registerTeam);

router.get("/team", authenticateTeam, getDetails);
router.get("/general-info", authenticateTeam, getGeneralInfo);
router.patch("/general-info", authenticateTeam, updateGeneralInfo);

router.get("/tasks", authenticateTeam, getTeamTasks);
router.get("/tasks/:id", authenticateTeam, getTaskById);
router.post("/tasks/:id/submit", authenticateTeam, submitTaskForReview);

router.get("/problem-statement", authenticateTeam, getProblemStatement);
router.get("/gallery", authenticateTeam, getImages);
router.get("/announcements", getAnnouncements);

router.post("/logout", authenticateTeam, teamLogout);

export default router;
