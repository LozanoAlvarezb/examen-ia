import mongoose from 'mongoose';
import { Question } from 'shared/src/models';
import crypto from 'crypto';

const QuestionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      A: { type: String, required: true },
      B: { type: String, required: true },
      C: { type: String, required: true },
      D: { type: String, required: true },
    },
    correct: {
      type: String,
      required: true,
      enum: ['A', 'B', 'C', 'D'],
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    explanation: {
      type: String,
      required: true,
      trim: true,
    },
    textHash: {
      type: String,
      required: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate SHA-1 hash of question text for duplicate detection
QuestionSchema.pre('save', function (next) {
  if (this.isModified('text') || !this.get('textHash')) {
    this.set('textHash', crypto.createHash('sha1').update(this.get('text')).digest('hex'));
  }
  next();
});

// Create a text index for efficient searching
QuestionSchema.index({ text: 'text' });

export default mongoose.model<Question & mongoose.Document>('Question', QuestionSchema);
