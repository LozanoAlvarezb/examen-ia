import express from 'express';
import * as examController from '../controllers/exam.controller';

const router = express.Router();

// No authentication required for local app
router.get('/', examController.getExams);
router.post('/', examController.createExam);
router.post('/bulk', examController.bulkImportExam);
router.get('/:id/full', examController.getExamWithQuestions);

export default router;
