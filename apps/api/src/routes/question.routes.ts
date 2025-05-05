import express from 'express';
import * as questionController from '../controllers/question.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Admin-only bulk import
router.post('/bulk', authenticate, authorizeAdmin, questionController.bulkImport);

// Get a question by ID (accessible to authenticated users)
router.get('/:id', authenticate, questionController.getById);

export default router;
