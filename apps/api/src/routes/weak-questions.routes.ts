import express from 'express';
import * as attemptController from '../controllers/attempt.controller';

const router = express.Router();

/**
 * @swagger
 * /api/weak-questions:
 *   get:
 *     summary: Get weak questions based on recent performance
 *     tags:
 *       - Weak Questions
 *     parameters:
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering attempts (defaults to 30 days ago)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of weak questions to return
 *     responses:
 *       200:
 *         description: List of weak questions with performance statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   questionId:
 *                     type: string
 *                   timesSeen:
 *                     type: integer
 *                   timesCorrect:
 *                     type: integer
 *                   successRate:
 *                     type: number
 */
router.get('/', attemptController.getWeakQuestions);

export default router;