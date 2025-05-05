import express from 'express';
import * as attemptController from '../controllers/attempt.controller';

const router = express.Router();

// No authentication required for local app
router.post('/', attemptController.startAttempt);
router.put('/:id/finish', attemptController.submitAnswers);
router.get('/:id', attemptController.getAttemptById);
router.get('/user/me', attemptController.getUserAttempts);

export default router;
