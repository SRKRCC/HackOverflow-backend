import { Router } from 'express';
import { registerTeam } from '../controllers/registerController.js';
import { flexibleUploadMiddleware } from '../middlewares/flexibleUpload.js';

console.log('Register routes module loaded');

const router = Router();

console.log('Setting up routes...');

// Apply flexible upload middleware that handles both JSON and multipart requests
router.post('/', flexibleUploadMiddleware, (req, res, next) => {
  console.log('POST /api/registerTeam hit');
  registerTeam(req, res);
});

router.get('/test', (req, res) => {
  console.log('GET /api/registerTeam/test hit');
  res.send('Register route working');
});

export { router };

export default router;
