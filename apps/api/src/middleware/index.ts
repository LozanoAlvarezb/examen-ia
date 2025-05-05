import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { CORS_ORIGIN, isProd } from '../config';

export const setupMiddleware = (app: express.Application): void => {
  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request logging
  app.use(morgan(isProd ? 'combined' : 'dev'));

  // Parse JSON body
  app.use(express.json({ limit: '10mb' }));
  
  // Parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
};
