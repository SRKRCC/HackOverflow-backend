import express from 'express';
import multer from 'multer';
import { getTeamImages, removeTeamImage, uploadTeamImages } from '../../controllers/adminControllers/galleryController.js';

const galleryRoutes = express.Router();
const upload = multer();

galleryRoutes.put('/:teamId/images', upload.array('images', 10), uploadTeamImages);
galleryRoutes.put('/:teamId/remove-image', removeTeamImage);
galleryRoutes.get('/:teamId/images', getTeamImages);

export default galleryRoutes;
