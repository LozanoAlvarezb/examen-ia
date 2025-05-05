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
  },
  {
    timestamps: true,
  }
);

// Validate exactly 100 questions
ExamSchema.pre('save', function(next) {
  if (this.isModified('questionIds') && this.questionIds.length !== 100) {
    return next(new Error('Exam must contain exactly 100 questions'));
  }
  next();
});

export default mongoose.model<Exam & mongoose.Document>('Exam', ExamSchema);
