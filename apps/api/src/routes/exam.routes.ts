import express from 'express';
import * as examController from '../controllers/exam.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Get list of exams (metadata only)
router.get('/', authenticate, examController.getExams);

// Create a new exam (admin only)
router.post('/', authenticate, authorizeAdmin, examController.createExam);

// Get exam with questions (but without correct answers)
router.get('/:id/full', authenticate, examController.getExamWithQuestions);

export default router;
