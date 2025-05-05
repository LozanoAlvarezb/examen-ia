import { ObjectId } from 'mongodb';

// Question model
export interface Question {
  _id: string | ObjectId;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct: 'A' | 'B' | 'C' | 'D';
  topic: string;
  explanation: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Question import format (from JSON)
export interface QuestionImport {
  id?: number; // Ignored by backend, which generates its own _id
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct: 'A' | 'B' | 'C' | 'D';
  topic: string;
  explanation: string;
}

// Exam model
export interface Exam {
  _id: string | ObjectId;
  name: string;
  questionIds: (string | ObjectId)[];
  negativeMark: number;
  timeLimit: number; // in minutes
  createdBy?: string | ObjectId;
  createdAt: Date;
}

// Answer type
export type Answer = 'A' | 'B' | 'C' | 'D' | null;

// Answers mapping
export type AnswerMap = Record<string, Answer>;

// Exam Attempt model
export interface Attempt {
  _id: string | ObjectId;
  examId: string | ObjectId;
  userId: string | ObjectId | null; // null for anonymous attempts
  answers: AnswerMap;
  startedAt: Date;
  finishedAt?: Date;
  scoreTotal?: number; // 0-100
  scoreByTopic?: Record<string, number>;
  correctCount?: number;
  wrongCount?: number;
  blankCount?: number;
}

// User model
export interface User {
  _id: string | ObjectId;
  email: string;
  hashedPassword: string;
  role: 'admin' | 'user';
}

// Auth request/response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    email: string;
    role: 'admin' | 'user';
  };
}

// Public exam response (without correct answers)
export interface PublicExam extends Omit<Exam, 'questionIds'> {
  questions: Omit<Question, 'correct'>[];
}

// Exam session state for frontend
export interface ExamSessionState {
  exam: Exam;
  answers: AnswerMap;
  startTime: number;
  remaining: number;
}
