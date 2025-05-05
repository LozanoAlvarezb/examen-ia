import express from 'express';
import * as examController from '../controllers/exam.controller';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Exam:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the exam
 *         title:
 *           type: string
 *           description: The title of the exam
 *         description:
 *           type: string
 *           description: The description of the exam
 *         timeLimit:
 *           type: number
 *           description: The time limit in minutes
 *         negativeMark:
 *           type: number
 *           description: Points deducted for incorrect answers
 *         passingScore:
 *           type: number
 *           description: Minimum score required to pass
 */

/**
 * @swagger
 * /api/exams:
 *   get:
 *     summary: Get all exams
 *     tags:
 *       - Exams
 *     responses:
 *       200:
 *         description: A list of exams
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Exam'
 */
router.get('/', examController.getExams);

/**
 * @swagger
 * /api/exams:
 *   post:
 *     summary: Create a new exam
 *     tags:
 *       - Exams
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Exam'
 *     responses:
 *       201:
 *         description: The created exam
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exam'
 */
router.post('/', examController.createExam);

/**
 * @swagger
 * /api/exams/bulk:
 *   post:
 *     summary: Import multiple exams
 *     tags:
 *       - Exams
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Exam'
 *     responses:
 *       200:
 *         description: The imported exams
 */
router.post('/bulk', examController.bulkImportExam);

/**
 * @swagger
 * /api/exams/{id}/full:
 *   get:
 *     summary: Get an exam with all its questions
 *     tags:
 *       - Exams
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The exam ID
 *     responses:
 *       200:
 *         description: The exam with all questions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exam'
 */
router.get('/:id/full', examController.getExamWithQuestions);

export default router;
