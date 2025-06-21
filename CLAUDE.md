# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an exam platform for AI and data science questions, built as a monorepo with separate API and web frontend. The system supports importing questions with Markdown formatting, real-time exam timers with WebSocket connections, and detailed performance analysis with topic-wise scoring.

## Development Commands

### Root Level Commands
- `pnpm install` - Install all dependencies across workspaces
- `pnpm dev` - Start both API (port 4000) and web frontend (port 3000) in development mode
- `pnpm build` - Build all packages for production
- `pnpm start` - Start the production API server

### API Commands (apps/api)
- `pnpm dev` - Start API server with nodemon/ts-node hot reload
- `pnpm build` - Compile TypeScript to JavaScript
- `pnpm start` - Start production server from dist/
- `pnpm test` - Run Jest tests

### Web Commands (apps/web)
- `pnpm dev` - Start Vite development server
- `pnpm build` - Build for production (runs TypeScript check + Vite build)
- `pnpm preview` - Preview production build

## Architecture

### Monorepo Structure
- **apps/api**: Express.js backend with MongoDB, WebSocket server for exam timers
- **apps/web**: React frontend with Material UI, Zustand state management, Vite build
- **packages/shared**: Shared TypeScript interfaces and types used by both frontend and backend

### Backend Architecture (apps/api)
- **Express.js** with TypeScript, Helmet, CORS, Morgan logging
- **MongoDB** with Mongoose ODM for data persistence
- **WebSocket Server** for real-time exam timer synchronization
- **Swagger** API documentation at `/api-docs`
- **MVC Pattern**: Controllers, models, routes, middleware separation
- **Timer Management**: WebSocket-based exam session tracking with auto-submission

### Frontend Architecture (apps/web)
- **React 18** with TypeScript and Material UI design system
- **React Router** for client-side routing
- **Zustand** for state management with persistence
- **Vite** for development and build tooling
- **WebSocket Client** for real-time timer updates during exams

### Data Models (packages/shared)
- **Question**: Text, multiple choice options (A-D), correct answer, topic, explanation
- **Exam**: Collection of question IDs with metadata
- **Attempt**: User exam session with answers, timing, and scoring data
- **ExamSessionState**: Client-side exam state with timer and answer tracking

### Key Features
- **Question Import**: JSON file upload with Markdown support in question text
- **Real-time Exam Timer**: WebSocket connection maintains server-authoritative timing
- **Negative Scoring**: Configurable penalty for wrong answers
- **Topic Analysis**: Performance breakdown by question topics
- **Auto-submission**: Exam automatically submits when time expires
- **Session Persistence**: Exam state persists in localStorage via Zustand middleware

## Database Requirements

MongoDB 4.4+ must be running locally. The API connects to MongoDB and handles database setup automatically through the connection utilities.

## Development Workflow

1. Start MongoDB locally
2. Run `pnpm install` from project root
3. Use `pnpm dev` to start both services simultaneously
4. Frontend available at http://localhost:3000
5. Backend API at http://localhost:4000
6. API documentation at http://localhost:4000/api-docs

## Question and Exam Management

Questions are imported via JSON files with this structure:
```json
[{
  "text": "Question text (supports Markdown)",
  "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
  "correct": "A",
  "topic": "Topic Name", 
  "explanation": "Explanation for correct answer"
}]
```

Upload questions at `/admin/questions` and create exams at `/admin/exams`.