import { Router } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask,
} from "../../controllers/adminControllers/taskControllers.js";
import { authenticateAdmin } from "../../middlewares/authenticateAdmin.js";

const router = Router();

router.use(authenticateAdmin);

// CRUD Endpoints
router.post("/", createTask); // Create task and assign to team
router.get("/", getTasks); // List all tasks
router.get("/:id", getTaskById); // Get one task
router.put("/:id", updateTask); // Update task
router.delete("/:id", deleteTask); // Delete task
router.post("/:id/complete", completeTask); // Admin completes task after review
export default router;
