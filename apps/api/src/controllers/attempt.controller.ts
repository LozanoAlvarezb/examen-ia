import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Attempt from '../models/attempt.model';
import Exam from '../models/exam.model';
import Question from '../models/question.model';
import { generateWSToken } from '../utils/jwt';
import { Answer } from 'shared/src/models';

export const startAttempt = async (req: Request, res: Response) => {
  try {
    const { examId } = req.body;
    
    if (!examId) {
      return res.status(400).json({ message: 'Exam ID is required' });
    }
    
    // Check if exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    // Create a new attempt
    const attempt = new Attempt({
      examId,
      userId: req.user ? req.user.userId : null, // Use null for anonymous attempts
      startedAt: new Date()
    });
    
    await attempt.save();
    
    // Generate WebSocket token for this attempt
    const wsToken = generateWSToken(
      attempt._id.toString(),
      attempt.userId ? attempt.userId.toString() : null,
      `${exam.timeLimit + 5}m` // 5 minutes extra to account for network issues
    );
    
    res.status(201).json({
      attemptId: attempt._id,
      wsToken,
      timeLimit: exam.timeLimit
    });
  } catch (error) {
    console.error('Start attempt error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const submitAnswers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ message: 'Answers object is required' });
    }
    
    // Find the attempt
    const attempt = await Attempt.findById(id);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    
    // Check if attempt is already finished
    if (attempt.finishedAt) {
      return res.status(400).json({ message: 'This attempt has already been submitted' });
    }
    
    // Verify user owns this attempt or is admin
    if (attempt.userId && req.user?.userId !== attempt.userId.toString() && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to submit this attempt' });
    }
    
    // Update answers and mark as finished
    attempt.answers = answers;
    attempt.finishedAt = new Date();
    
    // Calculate scores
    await calculateScores(attempt);
    
    await attempt.save();
    
    res.json({
      message: 'Attempt submitted successfully',
      attemptId: attempt._id,
      scoreTotal: attempt.scoreTotal
    });
  } catch (error) {
    console.error('Submit attempt error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAttemptById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find the attempt with populated exam info
    const attempt = await Attempt.findById(id)
      .populate('examId', 'name negativeMark timeLimit');
    
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    
    // Check if user has access to this attempt
    if (attempt.userId && req.user?.userId !== attempt.userId.toString() && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to view this attempt' });
    }
    
    // Check if attempt is finished
    if (!attempt.finishedAt) {
      return res.status(400).json({ message: 'This attempt has not been completed yet' });
    }
    
    // Get all questions for this exam
    const exam = await Exam.findById(attempt.examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    const questions = await Question.find({ _id: { $in: exam.questionIds } });
    
    // Create detailed results with questions and correct answers
    const results = {
      _id: attempt._id,
      exam: {
        _id: exam._id,
        name: exam.name,
        negativeMark: exam.negativeMark,
        timeLimit: exam.timeLimit
      },
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt,
      scoreTotal: attempt.scoreTotal,
      scoreByTopic: attempt.scoreByTopic,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      blankCount: attempt.blankCount,
      questions: questions.map(q => ({
        _id: q._id,
        text: q.text,
        options: q.options,
        topic: q.topic,
        explanation: q.explanation,
        correct: q.correct,
        userAnswer: attempt.answers.get(q._id.toString()) || null
      }))
    };
    
    res.json(results);
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserAttempts = async (req: Request, res: Response) => {
  try {
    // Get the user's attempts
    const attempts = await Attempt.find({ userId: req.user?.userId })
      .populate('examId', 'name')
      .sort({ startedAt: -1 })
      .select('-answers'); // Exclude detailed answers for performance
    
    res.json(attempts);
  } catch (error) {
    console.error('Get user attempts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper function to calculate scores for an attempt
async function calculateScores(attempt: mongoose.Document & any): Promise<void> {
  // Get the exam
  const exam = await Exam.findById(attempt.examId);
  if (!exam) {
    throw new Error('Exam not found');
  }
  
  // Get all questions
  const questions = await Question.find({ _id: { $in: exam.questionIds } });
  
  // Prepare stats
  const stats: { [topic: string]: { right: number, total: number } } = {};
  let correct = 0;
  let wrong = 0;
  let blank = 0;
  
  // Process each question
  for (const q of questions) {
    const questionId = q._id.toString();
    const userAnswer = attempt.answers.get(questionId) as Answer;
    const topic = q.topic;
    
    // Initialize topic stats if needed
    if (!stats[topic]) {
      stats[topic] = { right: 0, total: 0 };
    }
    stats[topic].total++;
    
    if (userAnswer === null) {
      blank++;
    } else if (userAnswer === q.correct) {
      correct++;
      stats[topic].right++;
    } else {
      wrong++;
    }
  }
  
  // Calculate total score
  const scoreTotal = Math.max(0, (correct - (wrong * exam.negativeMark)) * 100 / exam.questionIds.length);
  
  // Calculate topic scores
  const scoreByTopic = Object.fromEntries(
    Object.entries(stats).map(([topic, { right, total }]) => [topic, (right * 100) / total])
  );
  
  // Update attempt with scores
  attempt.scoreTotal = scoreTotal;
  attempt.scoreByTopic = scoreByTopic;
  attempt.correctCount = correct;
  attempt.wrongCount = wrong;
  attempt.blankCount = blank;
}
