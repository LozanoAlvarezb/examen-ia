import { Request, Response } from 'express';
import Question from '../models/question.model';
import { QuestionImport } from 'shared/src/models';
import crypto from 'crypto';

export const bulkImport = async (req: Request, res: Response) => {
  try {
    const questions: QuestionImport[] = req.body;

    // Validate that we have exactly 100 questions
    if (!Array.isArray(questions) || questions.length !== 100) {
      return res.status(400).json({ 
        message: `Bulk import requires exactly 100 questions, received ${Array.isArray(questions) ? questions.length : 0}` 
      });
    }

    // Validate question format
    for (const question of questions) {
      if (!question.text || 
          !question.options || 
          !question.options.A || 
          !question.options.B || 
          !question.options.C || 
          !question.options.D || 
          !question.correct || 
          !question.topic || 
          !question.explanation) {
        return res.status(400).json({ 
          message: 'All questions must have text, options (A,B,C,D), correct answer, topic, and explanation' 
        });
      }

      if (!['A', 'B', 'C', 'D'].includes(question.correct)) {
        return res.status(400).json({ 
          message: `Invalid correct answer format: ${question.correct}. Must be 'A', 'B', 'C', or 'D'` 
        });
      }
    }

    // Check for duplicates in the current import set
    const textHashes = new Set();
    for (const question of questions) {
      const hash = crypto.createHash('sha1').update(question.text).digest('hex');
      if (textHashes.has(hash)) {
        return res.status(400).json({ 
          message: 'Duplicate questions detected in the import set' 
        });
      }
      textHashes.add(hash);
    }

    // Check for duplicates with existing questions in the database
    const hashes = Array.from(textHashes);
    const existingQuestions = await Question.find({ textHash: { $in: hashes } });
    if (existingQuestions.length > 0) {
      return res.status(409).json({ 
        message: `${existingQuestions.length} questions already exist in the database` 
      });
    }

    // Create new questions
    const newQuestions = questions.map(q => ({
      text: q.text,
      options: q.options,
      correct: q.correct,
      topic: q.topic,
      explanation: q.explanation
    }));

    const insertedQuestions = await Question.insertMany(newQuestions);

    res.status(201).json({ 
      message: `Successfully imported ${insertedQuestions.length} questions`,
      questionIds: insertedQuestions.map(q => q._id)
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    res.json(question);
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
