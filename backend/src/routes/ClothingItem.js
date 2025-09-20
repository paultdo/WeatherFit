import express from 'express';
import controller from '../controllers/ClothingItemController.js';
import { ensureAuthenticated } from '../../middleware/sessionAuth.js';

const router = express.Router();

router.get('/:userId', ensureAuthenticated, controller.getClothingItemsByPerson);
router.get('/:userId/:id', ensureAuthenticated, controller.getClothingItemById);
router.post('/', ensureAuthenticated, controller.createClothingItem);
router.put('/:id', ensureAuthenticated, controller.updateClothingItem);
router.delete('/:id', ensureAuthenticated, controller.deleteClothingItem);