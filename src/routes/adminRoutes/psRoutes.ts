import { Router } from "express";
import multer from "multer";
import {
  uploadCsv,
  deleteStatement,
  getStatementById,
  getStatements,
  updateStatement,
} from "../../controllers/adminControllers/psControllers.js";
import { authenticateAdmin } from "../../middlewares/authenticateAdmin.js";
import { authenticateTeam } from "../../middlewares/authenticateTeam.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith(".csv")) {
      return cb(new Error("Only CSV files are allowed"));
    }
    cb(null, true);
  },
});

const router = Router();

// Admin routes
router.post("/csv",authenticateAdmin,upload.single("csv-file"),uploadCsv);
router.put("/:id", authenticateAdmin, updateStatement);
router.delete("/:id", authenticateAdmin, deleteStatement);

// Team routes
router.get("/:id", authenticateTeam, getStatementById);
router.get("/", authenticateTeam, getStatements);

export default router;
