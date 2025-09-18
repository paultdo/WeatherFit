import express from 'express';
import controller from '../controllers/LocationController.js';
import { ensureAuthenticated } from '../../middleware/sessionAuth.js';

const router = express.Router();

router.get('/:userId', ensureAuthenticated, controller.getLocationsByPerson);
router.get('/:userId/:id', ensureAuthenticated, controller.getLocationById);
router.get('/user/default/:userId', ensureAuthenticated, controller.getDefaultLocationByPerson);
router.post('/', ensureAuthenticated, controller.createLocation);
router.put('/:id', ensureAuthenticated, controller.updateLocation);
router.delete('/:id', ensureAuthenticated, controller.deleteLocation);


export default router;
