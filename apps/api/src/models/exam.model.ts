import mongoose from 'mongoose';
import { Exam } from 'shared/src/models';

const ExamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    questionIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    }],
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Validate exactly 100 questions
// ExamSchema.pre('save', function(next) {
//   if (this.isModified('questionIds') && this.questionIds.length !== 100) {
//     return next(new Error('Exam must contain exactly 100 questions'));
//   }
//   next();
// });

export default mongoose.model<Exam & mongoose.Document>('Exam', ExamSchema);
