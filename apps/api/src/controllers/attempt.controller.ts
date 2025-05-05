import crypto from 'crypto';
import { Request, Response } from 'express';
import Attempt from '../models/attempt.model';
import Exam from '../models/exam.model';
import Question from '../models/question.model';

// Helper function to calculate scores
const calculateScores = async (attempt: any, answers: Record<string, string | null>) => {
  // Fetch exam and questions
  const exam = await Exam.findById(attempt.examId);
  if (!exam) throw new Error('Exam not found');

  const questions = await Question.find({ _id: { $in: exam.questionIds } });

  // Initialize counters and topic scores
  let correctCount = 0;
  let wrongCount = 0;
  let blankCount = 0;
  const topicScores: Record<string, { correct: number, total: number }> = {};

  // Process each question
  questions.forEach(question => {
    const answer = answers[question._id.toString()];
    
    // Initialize topic counter if not exists
    if (!topicScores[question.topic]) {
      topicScores[question.topic] = { correct: 0, total: 0 };
    }
    topicScores[question.topic].total++;

    if (!answer) {
      blankCount++;
    } else if (answer === question.correct) {
      correctCount++;
      topicScores[question.topic].correct++;
    } else {
      wrongCount++;
    }
  });

  // Calculate final scores
  const totalQuestions = questions.length;
  const scoreTotal = ((correctCount - (wrongCount * attempt.negativeMark)) * 100) / totalQuestions;

  // Calculate percentage scores by topic
  const scoreByTopic = Object.entries(topicScores).reduce((acc, [topic, scores]) => {
    acc[topic] = (scores.correct * 100) / scores.total;
    return acc;
  }, {} as Record<string, number>);

  return {
    scoreTotal: Math.max(0, scoreTotal), // Ensure score doesn't go below 0
    scoreByTopic,
    correctCount,
    wrongCount,
    blankCount,
  };
};

export const startAttempt = async (req: Request, res: Response) => {
  try {
    const { examId, negativeMark, timeLimit } = req.body;

    if (!examId) {
      return res.status(400).json({
        message: 'Exam ID is required'
      });
    }

    // Verify exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        message: 'Exam not found'
      });
    }

    // Create new attempt with optional negativeMark and timeLimit parameters
    const attempt = new Attempt({
      examId,
      negativeMark: negativeMark !== undefined ? negativeMark : 0.25, // Default to 0.25 if not provided
      timeLimit: timeLimit !== undefined ? timeLimit : 120, // Default to 120 minutes if not provided
      startedAt: new Date(),
    });

    await attempt.save();

    // Generate WebSocket token
    const wsToken = crypto.randomBytes(32).toString('hex');

    res.status(201).json({
      attemptId: attempt._id,
      wsToken,
    });
  } catch (error: any) {
    console.error('Error starting attempt:', error);
    res.status(500).json({
      message: 'Failed to start attempt',
      error: error.message
    });
  }
};

export const submitAnswers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    const attempt = await Attempt.findById(id);
    if (!attempt) {
      return res.status(404).json({
        message: 'Attempt not found'
      });
    }

    if (attempt.finishedAt) {
      return res.status(400).json({
        message: 'This attempt has already been submitted'
      });
    }

    // Calculate scores - now passing the attempt object directly
    const scores = await calculateScores(attempt, answers);

    // Update attempt with answers and scores
    attempt.answers = answers;
    attempt.finishedAt = new Date();
    attempt.scoreTotal = scores.scoreTotal;
    attempt.scoreByTopic = scores.scoreByTopic;
    attempt.correctCount = scores.correctCount;
    attempt.wrongCount = scores.wrongCount;
    attempt.blankCount = scores.blankCount;

    await attempt.save();

    res.json(attempt);
  } catch (error: any) {
    console.error('Error submitting answers:', error);
    res.status(500).json({
      message: 'Failed to submit answers',
      error: error.message
    });
  }
};

export const getAttemptById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const attempt = await Attempt.findById(id);
    if (!attempt) {
      return res.status(404).json({
        message: 'Attempt not found'
      });
    }

    // Only return results if attempt is finished
    if (!attempt.finishedAt) {
      return res.status(400).json({
        message: 'This attempt is still in progress'
      });
    }

    // Fetch exam and questions for the response
    const exam = await Exam.findById(attempt.examId);
    if (!exam) {
      return res.status(404).json({
        message: 'Exam not found'
      });
    }

    const questions = await Question.find({ _id: { $in: exam.questionIds } });

    res.json({
      exam,
      questions,
      answers: attempt.answers,
      scoreTotal: attempt.scoreTotal,
      scoreByTopic: attempt.scoreByTopic,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      blankCount: attempt.blankCount,
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt,
    });
  } catch (error: any) {
    console.error('Error fetching attempt:', error);
    res.status(500).json({
      message: 'Failed to fetch attempt',
      error: error.message
    });
  }
};

// Get all attempts
export const getUserAttempts = async (_req: Request, res: Response) => {
  try {
    const attempts = await Attempt.find()
      .populate('examId', 'name')
      .select('examId scoreTotal startedAt finishedAt')
      .sort({ startedAt: -1 });

    res.json(attempts);
  } catch (error: any) {
    console.error('Error fetching attempts:', error);
    res.status(500).json({
      message: 'Failed to fetch attempts',
      error: error.message
    });
  }
};
