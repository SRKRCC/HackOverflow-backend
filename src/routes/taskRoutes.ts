import { Router } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../controllers/taskControllers.js";

const router = Router();

// CRUD Endpoints
router.post("/", createTask); // Create
router.get("/", getTasks); // List all
router.get("/:id", getTaskById); // Get one
router.put("/:id", updateTask); // Update
router.delete("/:id", deleteTask); // Delete

export default router;
