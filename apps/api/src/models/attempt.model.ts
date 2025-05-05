import mongoose from 'mongoose';
import { Attempt, Answer } from 'shared/src/models';

const AnswerSchema = new mongoose.Schema({
  type: String,
  enum: ['A', 'B', 'C', 'D', null],
  default: null,
});

const AttemptSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // null for anonymous attempts
      sparse: true,
      index: true,
    },
    answers: {
      type: Map,
      of: {
        type: String,
        enum: ['A', 'B', 'C', 'D', null],
      },
      default: new Map(),
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    finishedAt: {
      type: Date,
      required: false,
    },
    scoreTotal: {
      type: Number,
      required: false,
      min: 0,
      max: 100,
    },
    scoreByTopic: {
      type: Map,
      of: Number,
      required: false,
    },
    correctCount: {
      type: Number,
      required: false,
      min: 0,
    },
    wrongCount: {
      type: Number,
      required: false,
      min: 0,
    },
    blankCount: {
      type: Number,
      required: false,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index on examId and userId for faster queries
AttemptSchema.index({ examId: 1, userId: 1 });

export default mongoose.model<Attempt & mongoose.Document>('Attempt', AttemptSchema);
