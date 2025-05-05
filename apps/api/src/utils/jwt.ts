import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } from '../config';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};

export const generateWSToken = (attemptId: string, userId: string | null, expiresIn = '2h'): string => {
  const payload = {
    attemptId,
    userId,
    type: 'ws',
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyWSToken = (token: string): { attemptId: string; userId: string | null } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.type !== 'ws') {
      return null;
    }
    
    return {
      attemptId: decoded.attemptId,
      userId: decoded.userId,
    };
  } catch (error) {
    return null;
  }
};
