import mongoose from 'mongoose';
import { Attempt } from 'shared/src/models';

const AttemptSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: false,
      index: true,
    },
    customQuestionIds: {
      type: [String],
      required: false,
    },
    negativeMark: {
      type: Number,
      required: true,
      default: 0.25,
      min: 0,
      max: 1,
    },
    timeLimit: {
      type: Number,
      required: true,
      default: 120, // 120 minutes (2 hours)
      min: 10, // Minimum 10 minutes
      max: 240, // Maximum 4 hours
    },
    answers: {
      type: Map,
      of: {
        type: String,
        enum: ['A', 'B', 'C', 'D', null],
        default: null,
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
    scoreByTopic: [{
      _id: false,
      topic: { type: String, required: true },
      score: { type: Number, required: true, min: 0, max: 100 }
    }],
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

// Create index on examId for faster queries
AttemptSchema.index({ examId: 1 });

// Method to check if attempt is finished
AttemptSchema.methods.isFinished = function (): boolean {
  return !!this.finishedAt;
};

// Method to calculate time taken in minutes
AttemptSchema.methods.getTimeTaken = function (): number {
  if (!this.finishedAt) return 0;
  return Math.floor((this.finishedAt.getTime() - this.startedAt.getTime()) / (1000 * 60));
};

// Method to get percentage complete
AttemptSchema.methods.getProgressPercentage = function (): number {
  const total = [...this.answers.values()].length;
  const answered = [...this.answers.values()].filter(answer => answer !== null).length;
  return (answered / total) * 100;
};

export default mongoose.model<Attempt & mongoose.Document>('Attempt', AttemptSchema);
