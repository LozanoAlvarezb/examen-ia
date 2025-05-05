import express from 'express';
import * as attemptController from '../controllers/attempt.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Start a new attempt
router.post('/', authenticate, attemptController.startAttempt);

// Submit answers and finish attempt
router.put('/:id/finish', authenticate, attemptController.submitAnswers);

// Get detailed results for an attempt
router.get('/:id', authenticate, attemptController.getAttemptById);

// Get current user's attempts
router.get('/user/me', authenticate, attemptController.getUserAttempts);

export default router;
