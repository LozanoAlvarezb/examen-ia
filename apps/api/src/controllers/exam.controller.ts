import { Request, Response } from 'express';
import Exam from '../models/exam.model';
import Question from '../models/question.model';

export const bulkImportExam = async (req: Request, res: Response) => {
  try {
    const { name, questions } = req.body;

    // Validate required fields
    if (!name || !Array.isArray(questions)) {
      return res.status(400).json({
        message: 'Name and questions array are required'
      });
    }

    // Validate number of questions

    // First, insert all questions to database
    const questionData = questions.map(q => ({
      text: q.text,
      options: q.options,
      correct: q.correct,
      topic: q.topic,
      explanation: q.explanation
    }));

    // Insert questions and get their IDs
    const insertedQuestions = await Question.insertMany(questionData);
    const questionIds = insertedQuestions.map(q => q._id);

    // Create the exam with the question IDs
    const exam = new Exam({
      name,
      questionIds,
      // negativeMark and timeLimit will use default values from the model
    });

    await exam.save();

    res.status(201).json({
      message: `Successfully imported exam with ${questionIds.length} questions`,
      examId: exam._id,
      name: exam.name
    });
  } catch (error: any) {
    console.error('Error importing exam:', error);
    res.status(500).json({
      message: 'Failed to import exam',
      error: error.message
    });
  }
};

export const createExam = async (req: Request, res: Response) => {
  try {
    const { name, questionIds, negativeMark, timeLimit } = req.body;

    // Validate required fields
    if (!name || !Array.isArray(questionIds)) {
      return res.status(400).json({
        message: 'Name and questionIds array are required'
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
    const exams = await Exam.find().select('');
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
