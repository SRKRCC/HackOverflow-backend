import { Router } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask,
  moveTaskToPending
} from "../../controllers/adminControllers/taskControllers.js";
import { authenticateAdmin } from "../../middlewares/authenticateAdmin.js";

const router = Router();

router.use(authenticateAdmin);

router.post("/", createTask);
router.get("/", getTasks);
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.post("/:id/move-to-pending", moveTaskToPending);
router.post("/:id/complete", completeTask);
export default router;
