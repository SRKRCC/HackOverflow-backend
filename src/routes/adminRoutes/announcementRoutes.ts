import express from 'express';
import { createAnnouncement, deleteAnnouncement, getActiveAnnouncements, getAnnouncementById, getAnnouncements, updateAnnouncement } from '../../controllers/adminControllers/announcementController.js';
import { authenticateAdmin } from '../../middlewares/authenticateAdmin.js';


const announcementRouter = express.Router();

// Get all announcements
announcementRouter.get('/', getAnnouncements);

// Get active announcements
announcementRouter.get('/active', getActiveAnnouncements);

// Get single announcement by ID
announcementRouter.get('/:id', getAnnouncementById);

// Create new announcement
announcementRouter.post('/',authenticateAdmin , createAnnouncement);

// Update announcement
announcementRouter.put('/:id',authenticateAdmin , updateAnnouncement);

// Delete announcement
announcementRouter.delete('/:id',authenticateAdmin , deleteAnnouncement);

export default announcementRouter;
