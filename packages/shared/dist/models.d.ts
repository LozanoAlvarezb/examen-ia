export type Answer = 'A' | 'B' | 'C' | 'D' | null;
export type AnswerMap = Record<string, Answer>;
export interface Question {
    _id: string;
    text: string;
    options: {
        A: string;
        B: string;
        C: string;
        D: string;
    };
    correct: 'A' | 'B' | 'C' | 'D';
    topic: string;
    explanation: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface QuestionImport {
    id?: number;
    text: string;
    options: {
        A: string;
        B: string;
        C: string;
        D: string;
    };
    correct: 'A' | 'B' | 'C' | 'D';
    topic: string;
    explanation: string;
}
export interface Exam {
    _id: string;
    name: string;
    questionIds: string[];
    createdAt: Date;
}
export interface PublicExam extends Omit<Exam, 'questionIds'> {
    questions: Omit<Question, 'correct' | 'explanation'>[];
}
export interface Attempt {
    _id: string;
    examId?: string;
    customQuestionIds?: string[];
    userId?: string | null;
    answers: AnswerMap;
    negativeMark: number;
    timeLimit: number;
    startedAt: Date;
    finishedAt?: Date;
    scoreTotal?: number;
    scoreByTopic: Record<string, number>;
    correctCount?: number;
    wrongCount?: number;
    blankCount?: number;
}
export interface WSMessage {
    type: 'TICK' | 'FINISH' | 'SUBMIT';
    remainingSeconds?: number;
    answers?: AnswerMap;
}
export interface ExamResponse {
    exam: PublicExam;
    attemptId: string;
    wsToken: string;
}
export interface AttemptResultResponse {
    exam: Exam;
    questions: Question[];
    answers: AnswerMap;
    scoreTotal: number;
    scoreByTopic: Record<string, number>;
    correctCount: number;
    wrongCount: number;
    blankCount: number;
    startedAt: string;
    finishedAt: string;
}
export interface ExamSessionState {
    exam: PublicExam | null;
    answers: AnswerMap;
    startTime: number;
    remaining: number;
    negativeMark: number;
    timeLimit: number;
}
