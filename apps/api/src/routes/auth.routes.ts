import express from 'express';
import * as authController from '../controllers/auth.controller';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for login attempts - 10 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  standardHeaders: true,
  message: { message: 'Too many login attempts, please try again later' }
});

// Auth routes
router.post('/login', loginLimiter, authController.login);
router.post('/register', authController.register);
router.post('/refresh-token', authController.refreshToken);

export default router;
