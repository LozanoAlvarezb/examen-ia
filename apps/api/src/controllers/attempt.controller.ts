import * as crypto from 'crypto';
import { Request, Response } from 'express';
import Attempt from '../models/attempt.model';
import Exam from '../models/exam.model';
import Question from '../models/question.model';
import QuestionStat from '../models/questionStat.model';

// Helper function to calculate scores
const calculateScores = async (attempt: any, answers: Record<string, string | null>) => {
  // Fetch questions based on questionIds or custom question IDs
  let questions;
  if (attempt.questionIds && attempt.questionIds.length > 0) {
    questions = await Question.find({ _id: { $in: attempt.questionIds } });
  } else if (attempt.customQuestionIds && attempt.customQuestionIds.length > 0) {
    questions = await Question.find({ _id: { $in: attempt.customQuestionIds } });
  } else {
    throw new Error('No questions found in attempt');
  }

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
  const scoreByTopic = Object.entries(topicScores).map(([topic, scores]) => ({
    topic,
    score: (scores.correct * 100) / scores.total,
  }));

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

    // Create new attempt with snapshot of exam data
    const attempt = new Attempt({
      examName: exam.name,
      timeLimit: timeLimit !== undefined ? timeLimit : 120, // Default to 120 minutes if not provided
      negativeMark: negativeMark !== undefined ? negativeMark : 0.25, // Default to 0.25 if not provided
      questionIds: exam.questionIds,
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

    // Update QuestionStat for each question
    const questions = await Question.find({ 
      _id: { $in: attempt.questionIds || attempt.customQuestionIds } 
    });

    for (const question of questions) {
      const qId = question._id.toString();
      const answered = answers[qId];
      const correct = answered === question.correct;

      await QuestionStat.findOneAndUpdate(
        { questionId: question._id },
        {
          $inc: { timesSeen: 1, ...(correct ? { timesCorrect: 1 } : {}) },
          lastAttemptAt: new Date(),
          lastCorrect: correct,
        },
        { upsert: true, new: true }
      );
    }

    res.json(attempt);
  } catch (error: any) {
    console.error('Error submitting answers:', error);
    res.status(500).json({
      message: 'Failed to submit answers',
      error: error.message
    });
  }
};

// Get attempt with questions (for exam runner - no correct answers)
export const getAttemptWithQuestions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const attempt = await Attempt.findById(id);
    if (!attempt) {
      return res.status(404).json({
        message: 'Attempt not found'
      });
    }

    // Fetch questions based on questionIds or custom question IDs
    let questions;
    if (attempt.questionIds && attempt.questionIds.length > 0) {
      questions = await Question.find({ _id: { $in: attempt.questionIds } })
        .select('-correct -explanation'); // Exclude correct answers
    } else if (attempt.customQuestionIds && attempt.customQuestionIds.length > 0) {
      questions = await Question.find({ _id: { $in: attempt.customQuestionIds } })
        .select('-correct -explanation'); // Exclude correct answers
    } else {
      return res.status(404).json({
        message: 'No questions found in attempt'
      });
    }

    res.json({
      attempt: {
        _id: attempt._id,
        examName: attempt.examName,
        customQuestionIds: attempt.customQuestionIds,
        questionIds: attempt.questionIds,
        negativeMark: attempt.negativeMark,
        timeLimit: attempt.timeLimit,
        startedAt: attempt.startedAt,
      },
      questions
    });
  } catch (error: any) {
    console.error('Error fetching attempt with questions:', error);
    res.status(500).json({
      message: 'Failed to fetch attempt',
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

    // Fetch questions for the response
    let questions;
    
    if (attempt.questionIds && attempt.questionIds.length > 0) {
      questions = await Question.find({ _id: { $in: attempt.questionIds } });
    } else if (attempt.customQuestionIds && attempt.customQuestionIds.length > 0) {
      questions = await Question.find({ _id: { $in: attempt.customQuestionIds } });
    } else {
      return res.status(404).json({
        message: 'No questions found in attempt'
      });
    }

    res.json({
      examName: attempt.examName,
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
      .select('examName scoreTotal startedAt finishedAt')
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

// Get weak questions for the current user
export const getWeakQuestions = async (req: Request, res: Response) => {
  try {
    // query params: ?limit=100&mode=all|recent
    const limit = Number(req.query.limit) || 100;
    const mode = req.query.mode === 'recent' ? 'recent' : 'all';

    let match: Record<string, any> = { lastCorrect: false };

    if (mode === 'recent') {
      const lastAttempt = await Attempt.findOne().sort({ finishedAt: -1 });
      match = { ...match, lastAttemptAt: { $gte: lastAttempt?.finishedAt || new Date(0) } };
    }

    const stats = await QuestionStat.find(match)
      .populate('questionId')
      .sort({ timesSeen: -1 })
      .limit(limit);

    // Extract the populated question documents
    const questions = stats.map(s => s.questionId).filter(Boolean);

    res.json(questions);
  } catch (error: any) {
    console.error('Error fetching weak questions:', error);
    res.status(500).json({
      message: 'Failed to fetch weak questions',
      error: error.message
    });
  }
};


// Start a weak questions practice attempt
export const startWeakAttempt = async (req: Request, res: Response) => {
  try {
    const { questionIds, negativeMark = 0.25, timeLimit = 120 } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        message: 'Question IDs array is required'
      });
    }

    // Verify questions exist
    const questions = await Question.find({ _id: { $in: questionIds } });
    if (questions.length !== questionIds.length) {
      return res.status(400).json({
        message: 'Some questions were not found'
      });
    }

    // Create new attempt with custom question IDs
    const attempt = new Attempt({
      customQuestionIds: questionIds,
      negativeMark,
      timeLimit,
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
    console.error('Error starting weak attempt:', error);
    res.status(500).json({
      message: 'Failed to start weak questions attempt',
      error: error.message
    });
  }
};
