import { Router } from "express";
import multer from "multer";
import {
  uploadCsv,
  deleteStatement,
  updateStatement,
  createSingleStatement,
  getStatements,
  getStatementById,
} from "../../controllers/adminControllers/psControllers.js";
import { authenticateAdmin } from "../../middlewares/authenticateAdmin.js";

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
router.use(authenticateAdmin);
// Admin routes
router.post("/", createSingleStatement);
router.get("/", getStatements);
router.get("/:id", getStatementById);
router.post("/csv", upload.single("csv-file"), uploadCsv);
router.put("/:id", updateStatement);
router.delete("/:id", deleteStatement);

export default router;
