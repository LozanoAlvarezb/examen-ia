import express from 'express';
import * as attemptController from '../controllers/attempt.controller';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Attempt:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the attempt
 *         examId:
 *           type: string
 *           description: The ID of the exam being attempted
 *         userId:
 *           type: string
 *           description: The ID of the user taking the exam
 *         answers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: string
 *               selectedOptions:
 *                 type: array
 *                 items:
 *                   type: string
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: When the attempt was started
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: When the attempt was completed
 *         score:
 *           type: number
 *           description: The final score for the attempt
 *         status:
 *           type: string
 *           enum: [started, completed, expired]
 *           description: The status of the attempt
 */

/**
 * @swagger
 * /api/attempts:
 *   post:
 *     summary: Start a new exam attempt
 *     tags:
 *       - Attempts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               examId:
 *                 type: string
 *                 description: The ID of the exam to attempt
 *     responses:
 *       201:
 *         description: New attempt created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attempt'
 */
router.post('/', attemptController.startAttempt);

/**
 * @swagger
 * /api/attempts/{id}/finish:
 *   put:
 *     summary: Submit answers and finish an exam attempt
 *     tags:
 *       - Attempts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The attempt ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     selectedOptions:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       200:
 *         description: Attempt completed with score
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attempt'
 */
router.put('/:id/finish', attemptController.submitAnswers);

/**
 * @swagger
 * /api/attempts/{id}:
 *   get:
 *     summary: Get an attempt by ID
 *     tags:
 *       - Attempts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The attempt ID
 *     responses:
 *       200:
 *         description: Attempt data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attempt'
 */
router.get('/:id', attemptController.getAttemptById);

/**
 * @swagger
 * /api/attempts/user/me:
 *   get:
 *     summary: Get all attempts for the current user
 *     tags:
 *       - Attempts
 *     responses:
 *       200:
 *         description: List of user's attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Attempt'
 */
router.get('/user/me', attemptController.getUserAttempts);

export default router;
