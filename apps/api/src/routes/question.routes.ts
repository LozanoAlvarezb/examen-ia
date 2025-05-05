import express from 'express';
import * as questionController from '../controllers/question.controller';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Question:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the question
 *         text:
 *           type: string
 *           description: The question text
 *         options:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               isCorrect:
 *                 type: boolean
 *         examId:
 *           type: string
 *           description: The ID of the exam this question belongs to
 *         points:
 *           type: number
 *           description: The points awarded for a correct answer
 */

/**
 * @swagger
 * /api/questions/bulk:
 *   post:
 *     summary: Bulk import questions
 *     tags:
 *       - Questions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Question'
 *     responses:
 *       200:
 *         description: Questions successfully imported
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *                   description: Number of questions imported
 */
router.post('/bulk', questionController.bulkImport);

/**
 * @swagger
 * /api/questions/{id}:
 *   get:
 *     summary: Get a question by ID
 *     tags:
 *       - Questions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The question ID
 *     responses:
 *       200:
 *         description: The question data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       404:
 *         description: Question not found
 */
router.get('/:id', questionController.getById);

export default router;
