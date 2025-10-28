import Router from 'express';
import { getStatements } from '../controllers/adminControllers/psControllers.js';

const publicRoutes = Router();

publicRoutes.get("/problem-statements", getStatements);

export default publicRoutes;