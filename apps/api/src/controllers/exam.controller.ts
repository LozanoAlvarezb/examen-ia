import { Request, Response } from 'express';
import Exam from '../models/exam.model';
import Question from '../models/question.model';
import mongoose from 'mongoose';

export const createExam = async (req: Request, res: Response) => {
  try {
    const { name, questionIds, negativeMark, timeLimit } = req.body;

    if (!name || !questionIds || !Array.isArray(questionIds)) {
      return res.status(400).json({
        message: 'Exam name and questionIds array are required'
      });
    }

    // Validate we have exactly 100 questions
    if (questionIds.length !== 100) {
      return res.status(400).json({
        message: `Exam must contain exactly 100 questions, received ${questionIds.length}`
      });
    }

    // Convert string IDs to ObjectIds
    const objectIds = questionIds.map(id => new mongoose.Types.ObjectId(id));

    // Verify all question IDs exist in the database
    const existingQuestions = await Question.countDocuments({
      _id: { $in: objectIds }
    });

    if (existingQuestions !== 100) {
      return res.status(400).json({
        message: `Some question IDs are invalid. Found ${existingQuestions} out of 100 required questions`
      });
    }

    // Create the exam
    const exam = new Exam({
      name,
      questionIds: objectIds,
      negativeMark: negativeMark ?? 0.25,
      timeLimit: timeLimit ?? 120,
      createdBy: req.user?.userId
    });

    await exam.save();

    res.status(201).json({
      _id: exam._id,
      name: exam.name,
      negativeMark: exam.negativeMark,
      timeLimit: exam.timeLimit,
      createdBy: exam.createdBy,
      createdAt: exam.createdAt
    });
  } catch (error) {
    console.error('Create exam error:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getExams = async (req: Request, res: Response) => {
  try {
    // Return list of exams with metadata (without questions)
    const exams = await Exam.find({}, {
      questionIds: 0 // Exclude questionIds from response
    }).sort({ createdAt: -1 });

    res.json(exams);
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getExamWithQuestions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    // Get all questions for this exam but exclude the correct answers
    const questions = await Question.find(
      { _id: { $in: exam.questionIds } },
      { correct: 0, textHash: 0 } // Exclude correct answers and textHash
    );
    
    // Return the exam with questions but without answers
    res.json({
      _id: exam._id,
      name: exam.name,
      negativeMark: exam.negativeMark,
      timeLimit: exam.timeLimit,
      createdBy: exam.createdBy,
      createdAt: exam.createdAt,
      questions
    });
  } catch (error) {
    console.error('Get exam with questions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
