import { Router } from 'express';
import { registerTeam } from '../controllers/registerController.js';

console.log('Register routes module loaded');

const router = Router();

console.log('Setting up routes...');

router.post('/', (req, res, next) => {
  console.log('POST /api/registerTeam hit');
  registerTeam(req, res);
});

router.get('/test', (req, res) => {
  console.log('GET /api/registerTeam/test hit');
  res.send('Register route working');
});

export { router };

export default router;
