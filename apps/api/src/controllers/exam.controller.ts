import { Request, Response } from 'express';
import Exam from '../models/exam.model';
import Question from '../models/question.model';

export const createExam = async (req: Request, res: Response) => {
  try {
    const { name, questionIds, negativeMark, timeLimit } = req.body;

    // Validate required fields
    if (!name || !Array.isArray(questionIds)) {
      return res.status(400).json({
        message: 'Name and questionIds array are required'
      });
    }

    // Validate number of questions
    if (questionIds.length !== 100) {
      return res.status(400).json({
        message: `Invalid number of questions. Expected 100, got ${questionIds.length}`
      });
    }

    // Verify all questions exist
    const questions = await Question.find({
      _id: { $in: questionIds }
    });

    if (questions.length !== questionIds.length) {
      return res.status(400).json({
        message: 'One or more question IDs are invalid'
      });
    }

    // Create exam
    const exam = new Exam({
      name,
      questionIds,
      negativeMark: negativeMark || 0.25,
      timeLimit: timeLimit || 120,
    });

    await exam.save();

    res.status(201).json(exam);
  } catch (error: any) {
    console.error('Error creating exam:', error);
    res.status(500).json({
      message: 'Failed to create exam',
      error: error.message
    });
  }
};

export const getExams = async (_req: Request, res: Response) => {
  try {
    const exams = await Exam.find().select('-questionIds');
    res.json(exams);
  } catch (error: any) {
    console.error('Error fetching exams:', error);
    res.status(500).json({
      message: 'Failed to fetch exams',
      error: error.message
    });
  }
};

export const getExamWithQuestions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);

    if (!exam) {
      return res.status(404).json({
        message: 'Exam not found'
      });
    }

    // Fetch questions but exclude correct answers and explanations
    const questions = await Question.find({
      _id: { $in: exam.questionIds }
    }).select('-correct -explanation');

    // Return exam with questions but without sensitive data
    res.json({
      _id: exam._id,
      name: exam.name,
      timeLimit: exam.timeLimit,
      negativeMark: exam.negativeMark,
      questions,
      createdAt: exam.createdAt,
    });
  } catch (error: any) {
    console.error('Error fetching exam:', error);
    res.status(500).json({
      message: 'Failed to fetch exam',
      error: error.message
    });
  }
};
