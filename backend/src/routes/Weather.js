import express from 'express';
import controller from '../controllers/WeatherController.js';
import { ensureAuthenticated } from '../../middleware/sessionAuth.js';

const router = express.Router();

router.post('/recommendation', ensureAuthenticated, controller.getRecommendation);
router.post('/forecast', ensureAuthenticated, controller.getHourlyRecommendation);

export default router;
