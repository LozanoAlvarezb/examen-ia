import { Request, Response } from 'express';
import Question from '../models/question.model';
import { QuestionImport } from 'shared/src/models';
import crypto from 'crypto';

export const bulkImport = async (req: Request, res: Response) => {
  try {
    const questions: QuestionImport[] = req.body;

    // Validate array length
    if (!Array.isArray(questions) || questions.length !== 100) {
      return res.status(400).json({
        message: `Invalid number of questions. Expected 100, got ${questions?.length || 0}`
      });
    }

    // Generate hashes for duplicate detection
    const hashes = questions.map(q => 
      crypto.createHash('sha1').update(q.text).digest('hex')
    );

    // Check for duplicates within the import set
    const uniqueHashes = new Set(hashes);
    if (uniqueHashes.size !== questions.length) {
      return res.status(400).json({
        message: 'Duplicate questions detected in the import set'
      });
    }

    // Check for existing questions in database
    const existingQuestions = await Question.find({
      textHash: { $in: Array.from(uniqueHashes) }
    });

    if (existingQuestions.length > 0) {
      return res.status(400).json({
        message: `${existingQuestions.length} questions already exist in the database`
      });
    }

    // Validate each question
    for (const [index, question] of questions.entries()) {
      if (!question.text || !question.options || !question.correct || !question.topic || !question.explanation) {
        return res.status(400).json({
          message: `Question at index ${index} is missing required fields`
        });
      }

      const { A, B, C, D } = question.options;
      if (!A || !B || !C || !D) {
        return res.status(400).json({
          message: `Question at index ${index} is missing one or more options`
        });
      }

      if (!['A', 'B', 'C', 'D'].includes(question.correct)) {
        return res.status(400).json({
          message: `Question at index ${index} has invalid correct answer: ${question.correct}`
        });
      }
    }

    // Create questions in database
    await Question.insertMany(questions);

    res.status(201).json({
      message: 'Successfully imported 100 questions'
    });
  } catch (error: any) {
    console.error('Error importing questions:', error);
    res.status(500).json({
      message: 'Failed to import questions',
      error: error.message
    });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        message: 'Question not found'
      });
    }

    res.json(question);
  } catch (error: any) {
    console.error('Error fetching question:', error);
    res.status(500).json({
      message: 'Failed to fetch question',
      error: error.message
    });
  }
};
