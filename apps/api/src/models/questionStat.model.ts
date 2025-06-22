import { Schema, model } from 'mongoose';

const QuestionStatSchema = new Schema({
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', unique: true },

  timesSeen: { type: Number, default: 0 },
  timesCorrect: { type: Number, default: 0 },

  lastAttemptAt: { type: Date, default: Date.now },
  lastCorrect: { type: Boolean, default: false },
});

export default model('QuestionStat', QuestionStatSchema);