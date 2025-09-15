import express from 'express';
import controller from '../controllers/UserController.js';
import { ensureAuthenticated } from '../../middleware/sessionAuth.js';

const router = express.Router();

router.get('/', ensureAuthenticated, controller.getUserPage);
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.get('/me', controller.me);

export default router;
