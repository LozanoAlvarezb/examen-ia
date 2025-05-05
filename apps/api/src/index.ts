import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import WebSocket from 'ws';
import { CORS_ORIGIN, PORT } from './config';
import { specs } from './config/swagger';
import connectDB from './utils/database';

// Import routes
import attemptRoutes from './routes/attempt.routes';
import examRoutes from './routes/exam.routes';
import questionRoutes from './routes/question.routes';

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// API Routes
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/attempts', attemptRoutes);

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active exam sessions
const examSessions = new Map<string, {
  ws: WebSocket;
  startTime: number;
  timeLimit: number;
  timer?: NodeJS.Timeout;
}>();

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const attemptId = url.searchParams.get('attemptId');
  const timeLimit = parseInt(url.searchParams.get('timeLimit') || '0', 10);

  if (!attemptId || !timeLimit) {
    ws.close();
    return;
  }

  // Store session info
  const startTime = Date.now();
  examSessions.set(attemptId, {
    ws,
    startTime,
    timeLimit: timeLimit * 60 * 1000, // Convert minutes to milliseconds
  });

  // Set up timer
  const timer = setInterval(() => {
    const session = examSessions.get(attemptId);
    if (!session) return;

    const elapsed = Date.now() - session.startTime;
    const remaining = Math.max(0, session.timeLimit - elapsed);
    const remainingSeconds = Math.ceil(remaining / 1000);

    // Send remaining time to client
    ws.send(JSON.stringify({
      type: 'TICK',
      remainingSeconds,
    }));

    // If time's up, send finish message and close connection
    if (remaining <= 0) {
      ws.send(JSON.stringify({ type: 'FINISH' }));
      ws.close();
      clearInterval(timer);
      examSessions.delete(attemptId);
    }
  }, 1000);

  examSessions.get(attemptId)!.timer = timer;

  // Handle client messages (e.g., partial submissions)
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === 'SUBMIT') {
        // Handle partial submission (can be implemented later)
        console.log(`Received partial submission for attempt ${attemptId}`);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  // Clean up on connection close
  ws.on('close', () => {
    const session = examSessions.get(attemptId);
    if (session?.timer) {
      clearInterval(session.timer);
    }
    examSessions.delete(attemptId);
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket server ready for exam sessions`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');

  // Close all WebSocket connections
  for (const [attemptId, session] of examSessions) {
    if (session.timer) {
      clearInterval(session.timer);
    }
    session.ws.close();
  }

  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
