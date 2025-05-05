import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from 'shared/src/models';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/, 'Please provide a valid email address'],
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create an index on email for faster queries
UserSchema.index({ email: 1 });

// Method to check if password is valid
UserSchema.methods.isValidPassword = async function(password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.hashedPassword);
};

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (this.isModified('hashedPassword')) {
    this.hashedPassword = await bcrypt.hash(this.hashedPassword, 10);
  }
  next();
});

export default mongoose.model<User & mongoose.Document>('User', UserSchema);
