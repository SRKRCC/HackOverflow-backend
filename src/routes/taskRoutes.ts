import { Router } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../controllers/taskControllers.js";
import { authenticate,authorizeRole} from "../middlewares/authMiddleware.ts.js";

const router = Router();

router.use(authenticate,authorizeRole("admin")); //if give access permission to team by authorizeRole("team")

// CRUD Endpoints
router.post("/", createTask); // Create
router.get("/", getTasks); // List all
router.get("/:id", getTaskById); // Get one
router.put("/:id", updateTask); // Update
router.delete("/:id", deleteTask); // Delete

export default router;
