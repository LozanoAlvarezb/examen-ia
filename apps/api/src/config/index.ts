import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Environment
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const isProd = NODE_ENV === 'production';

// Server
export const PORT = parseInt(process.env.PORT || '4000', 10);

// Database
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/exam-ai';

// Authentication
export const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_production';
export const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
export const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';

// CORS
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// WebSocket
export const WS_SECRET = process.env.WS_SECRET || 'ws_secret_key_change_in_production';
export const WS_ORIGIN = process.env.WS_ORIGIN || 'http://localhost:3000';
