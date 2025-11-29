import { Router } from "express";
import { getDetails, getAllTeams, verifyPayment, patchTeam, patchMember, deleteTeam } from "../../controllers/adminControllers/teamControllers.js";
import { authenticateAdmin } from "../../middlewares/authenticateAdmin.js";
import { validateTeamId } from "../../middlewares/validateTeamId.js";
import { validateTeamPatchRequest, validateMemberPatchRequest } from "../../middlewares/validatePatchFields.js";
import { logger } from "../../middlewares/logger.js";

const router = Router();

router.use(logger);

router.get("/", authenticateAdmin, getAllTeams);
router.get("/:teamId", validateTeamId, authenticateAdmin, getDetails);
router.patch("/:teamId", authenticateAdmin, validateTeamPatchRequest, patchTeam);
router.patch("/:teamId/members/:memberId", authenticateAdmin, validateMemberPatchRequest, patchMember);
router.delete("/:teamId", authenticateAdmin, deleteTeam);
router.patch("/:teamId/verify-payment", authenticateAdmin, verifyPayment);

export default router;