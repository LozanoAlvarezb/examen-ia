import express from 'express';
import * as questionController from '../controllers/question.controller';

const router = express.Router();

// No authentication required for local app
router.post('/bulk', questionController.bulkImport);
router.get('/:id', questionController.getById);

export default router;
