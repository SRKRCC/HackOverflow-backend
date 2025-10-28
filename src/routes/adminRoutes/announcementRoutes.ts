import express from 'express';
import { createAnnouncement, deleteAnnouncement, getActiveAnnouncements, getAnnouncementById, getAnnouncements, updateAnnouncement } from '../../controllers/adminControllers/announcementController.js';
import { authenticateAdmin } from '../../middlewares/authenticateAdmin.js';


const announcementRoutes = express.Router();

announcementRoutes.use(authenticateAdmin);

announcementRoutes.get('/', getAnnouncements);
announcementRoutes.get('/active', getActiveAnnouncements);
announcementRoutes.get('/:id', getAnnouncementById);

announcementRoutes.post('/', createAnnouncement);
announcementRoutes.put('/:id', updateAnnouncement);
announcementRoutes.delete('/:id', deleteAnnouncement);

export default announcementRoutes;
