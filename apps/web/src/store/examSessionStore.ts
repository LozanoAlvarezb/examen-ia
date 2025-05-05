import { Answer, AnswerMap, ExamSessionState, PublicExam } from 'shared/src/models';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ExamSessionStore extends ExamSessionState {
  // Exam state properties
  isLoading: boolean;
  isStarted: boolean;
  isFinished: boolean;
  attemptId: string | null;
  wsToken: string | null;
  negativeMark: number;
  timeLimit: number;
  
  // Actions
  setExam: (exam: PublicExam) => void;
  startExam: (attemptId: string, wsToken: string) => void;
  setAnswer: (questionId: string, answer: Answer) => void;
  updateTimer: (seconds: number) => void;
  finishExam: () => void;
  resetSession: () => void;
}

// Initial state
const initialState = {
  exam: null,
  answers: {},
  startTime: 0,
  remaining: 0,
  isLoading: false,
  isStarted: false,
  isFinished: false,
  attemptId: null,
  wsToken: null,
  negativeMark: 0.25, // Default negative mark
  timeLimit: 120,     // Default time limit in minutes
};

// Create the store with persistence
export const useExamSessionStore = create<ExamSessionStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setExam: (exam) => set({ 
        exam, 
        answers: {},
        isLoading: false 
      }),
      
      startExam: (attemptId, wsToken) => set({ 
        attemptId, 
        wsToken,
        isStarted: true,
        startTime: Date.now(),
      }),
      
      setAnswer: (questionId, answer) => set((state) => ({
        answers: {
          ...state.answers,
          [questionId]: answer,
        }
      })),
      
      updateTimer: (seconds) => set({ 
        remaining: seconds 
      }),
      
      finishExam: () => set({ 
        isFinished: true 
      }),
      
      resetSession: () => set(initialState),
    }),
    {
      name: 'exam-session-storage',
      partialize: (state) => ({
        // Only persist these fields
        exam: state.exam,
        answers: state.answers,
        startTime: state.startTime,
        remaining: state.remaining,
        isStarted: state.isStarted,
        isFinished: state.isFinished,
        attemptId: state.attemptId,
        negativeMark: state.negativeMark,
        timeLimit: state.timeLimit,
      }),
    }
  )
);

// Helper functions for use with the store
export const getAnsweredCount = (answers: AnswerMap): number => {
  return Object.values(answers).filter((answer) => answer !== null).length;
};

export const formatRemainingTime = (seconds: number): string => {
  if (seconds <= 0) return '00:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
