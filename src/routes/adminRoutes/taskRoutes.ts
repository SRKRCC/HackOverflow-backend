import { Router } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../../controllers/adminControllers/taskControllers.js";
import { authenticateAdmin } from "../../middlewares/authenticateAdmin.js";

const router = Router();

router.use(authenticateAdmin);

// CRUD Endpoints
router.post("/", createTask); // Create
router.get("/", getTasks); // List all
router.get("/:id", getTaskById); // Get one
router.put("/:id", updateTask); // Update
router.delete("/:id", deleteTask); // Delete

export default router;
