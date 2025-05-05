import mongoose from 'mongoose';
import { MONGO_URI } from '../config';
import Question from '../models/question.model';
import Exam from '../models/exam.model';

const setupDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if we already have questions
    const questionCount = await Question.countDocuments();
    if (questionCount === 0) {
      console.log('No questions found. Please import questions using the bulk import feature.');
    } else {
      console.log(`Found ${questionCount} existing questions`);
    }

    // Check if we have any exams
    const examCount = await Exam.countDocuments();
    if (examCount === 0) {
      console.log('No exams found. Create an exam after importing questions.');
    } else {
      console.log(`Found ${examCount} existing exams`);
    }

    await mongoose.disconnect();
    console.log('Database check complete');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  setupDatabase();
}

export default setupDatabase;
