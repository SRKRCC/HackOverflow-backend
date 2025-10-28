import express from 'express';
import multer from 'multer';
import { getTeamImages, removeTeamImage, uploadTeamImages } from '../../controllers/adminControllers/galleryController.js';

const galleryRoutes = express.Router();
const upload = multer(); // Memory storage for streaming uploads

// Upload multiple images for a team
galleryRoutes.put('/:teamId/images', upload.array('images', 10), uploadTeamImages);

// Remove a specific image
galleryRoutes.put('/:teamId/remove-image', removeTeamImage);

// Get all team images
galleryRoutes.get('/:teamId/images', getTeamImages);

export default galleryRoutes;
