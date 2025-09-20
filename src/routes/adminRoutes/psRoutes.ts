import { Router } from "express";
import {
    createStatement,
    deleteStatement,
    getStatementById,
    getStatements,
    updateStatement,
} from '../../controllers/adminControllers/psControllers.js'
import { authenticateAdmin } from "../../middlewares/authenticateAdmin.js";
import { authenticateTeam } from "../../middlewares/authenticateTeam.js";

const router = Router();

//Routes for admin only
router.post("/",authenticateAdmin,createStatement);//create a statement
router.put("/:id",authenticateAdmin,updateStatement);//update the statement by id
router.delete("/:id",authenticateAdmin,deleteStatement);//delete the statement by id

//Routes for Teams
router.get("/:id",authenticateTeam,getStatementById);//get the atement by id
router.get("/",authenticateTeam,getStatements);//show all statements

export default router;
