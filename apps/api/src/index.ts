import express from 'express';
import http from 'http';
import path from 'path';
import WebSocket from 'ws';
import { PORT } from './config';
import { setupMiddleware } from './middleware';
import connectDB from './utils/database';
import { verifyWSToken } from './utils/jwt';

// Import route files
import attemptRoutes from './routes/attempt.routes';
import authRoutes from './routes/auth.routes';
import examRoutes from './routes/exam.routes';
import questionRoutes from './routes/question.routes';

// Initialize Express app
const app = express();

// Setup middleware
setupMiddleware(app);

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  verifyClient: (info, cb) => {
    const token = new URL(info.req.url!, 'wss://localhost').searchParams.get('token');
    if (!token) {
      cb(false, 401, 'Unauthorized');
      return;
    }
    
    const verified = verifyWSToken(token);
    if (!verified) {
      cb(false, 401, 'Invalid token');
      return;
    }
    
    // Add the decoded token to the request for later use
    (info.req as any).attemptData = verified;
    cb(true);
  }
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const attemptData = (req as any).attemptData;
  const attemptId = attemptData.attemptId;
  const userId = attemptData.userId;
  
  console.log(`WebSocket connection established for attempt ${attemptId}`);
  
  // Store the connection info for timer updates
  const connectionInfo = {
    ws,
    attemptId,
    userId,
    startTime: Date.now(),
    remaining: 0, // Will be set based on the exam time limit
  };
  
  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'SUBMIT') {
        // Handle partial answer submission (autosave)
        console.log(`Received partial submission for attempt ${attemptId}`);
        // Implementation will be added in the attempt service
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log(`WebSocket connection closed for attempt ${attemptId}`);
    // Clean up timer and resources
  });
  
  // Send initial timer value
  ws.send(JSON.stringify({ type: 'TICK', remainingSeconds: 0 }));
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/attempts', attemptRoutes);

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../web/dist')));
  
  app.get('*', (_, res) => {
    res.sendFile(path.join(__dirname, '../../web/dist/index.html'));
  });
}

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start HTTP/WebSocket server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket server running at ws://localhost:${PORT}/ws/exam`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
