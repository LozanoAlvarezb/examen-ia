# Exam AI & Data-Science Platform

A local application for creating and taking exams with support for AI and data science questions.

## Features

- Import 100-question exams with support for Markdown formatting
- Real-time exam timer with auto-submission
- Topic-wise scoring and performance analysis
- Negative marking support
- Interactive question navigator
- Detailed exam results with explanations

## Prerequisites

- Node.js 16+
- MongoDB 4.4+
- pnpm (install with `npm install -g pnpm`)

## Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start MongoDB locally:

   ```bash
   mongod --dbpath /path/to/data/directory
   ```

4. Start the development servers:
   ```bash
   pnpm dev
   ```

The application will be available at:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Adding Questions

1. Create a JSON file with 100 questions in the following format:

   ```json
   [
     {
       "text": "Question text (supports Markdown)",
       "options": {
         "A": "Option A",
         "B": "Option B",
         "C": "Option C",
         "D": "Option D"
       },
       "correct": "A",
       "topic": "Topic Name",
       "explanation": "Explanation for the correct answer"
     }
     // ... 99 more questions
   ]
   ```

2. Go to http://localhost:3000/admin/questions
3. Upload your questions file
4. Create an exam using the imported questions

## Development

- Backend code is in `apps/api`
- Frontend code is in `apps/web`
- Shared types are in `packages/shared`

## Scripts

- `pnpm dev` - Start both frontend and backend in development mode
- `pnpm build` - Build all packages
- `pnpm start` - Start the production server

## License

MIT
