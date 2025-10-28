import express from 'express';
import multer from 'multer';
import { getTeamImages, getTeamImagesByToken, removeTeamImage, uploadTeamImages } from '../../controllers/adminControllers/galleryController.js';
import { authenticateTeam } from '../../middlewares/authenticateTeam.js';


const galleryRouter = express.Router();
const upload = multer(); // Memory storage for streaming uploads

// Upload multiple images for a team
galleryRouter.put('/:teamId/images', upload.array('images', 10), uploadTeamImages);

// Remove a specific image
galleryRouter.put('/:teamId/remove-image', removeTeamImage);

// Get all team images
galleryRouter.get('/:teamId/images', getTeamImages);
galleryRouter.get('/images', authenticateTeam , getTeamImagesByToken);

export default galleryRouter;
