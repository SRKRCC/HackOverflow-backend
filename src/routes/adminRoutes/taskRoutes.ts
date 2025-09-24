import { Router } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
<<<<<<< HEAD:src/routes/taskRoutes.ts
} from "../controllers/taskControllers.js";
import { authenticate,authorizeRole} from "../middlewares/authMiddleware.ts.js";

const router = Router();

router.use(authenticate,authorizeRole("admin")); //if give access permission to team by authorizeRole("team")
=======
} from "../../controllers/adminControllers/taskControllers.js";
import { authenticateAdmin } from "../../middlewares/authenticateAdmin.js";

const router = Router();

router.use(authenticateAdmin);
>>>>>>> 112abe90705820b6201af877b55839fa3ece537e:src/routes/adminRoutes/taskRoutes.ts

// CRUD Endpoints
router.post("/", createTask); // Create
router.get("/", getTasks); // List all
router.get("/:id", getTaskById); // Get one
router.put("/:id", updateTask); // Update
router.delete("/:id", deleteTask); // Delete

export default router;
