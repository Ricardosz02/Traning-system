import { Router } from 'express';
import { getExercises, createExercise } from '../controllers/exerciseController.js';

const router = Router();

router.get('/', getExercises);
router.post('/', createExercise);

export default router;