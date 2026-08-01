import { Router } from 'express';
import { generatePlan } from '../controllers/aiController.js';

const router = Router();

// Rejestracja trasy POST dla generatora planów
router.post('/generate', generatePlan);

export default router;