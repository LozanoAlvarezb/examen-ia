// Environment variables with defaults for local development
export const PORT = process.env.PORT || 4000;
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/exam-ai';
export const WS_SECRET = process.env.WS_SECRET || 'local-websocket-secret';

// CORS configuration
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
export const WS_ORIGIN = process.env.WS_ORIGIN || 'http://localhost:3000';

// Environment check
export const isProd = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development';
