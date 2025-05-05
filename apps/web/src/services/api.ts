import axios from 'axios';
import { AnswerMap, AttemptResultResponse, Exam, ExamResponse, PublicExam } from 'shared/src/models';

const API_URL = '/api';

// Question APIs
export const bulkImportQuestions = async (questions: any[]) => {
  const response = await axios.post(`${API_URL}/questions/bulk`, questions);
  return response.data;
};

// Exam APIs
export const bulkImportExams = async (examName: string, questions: any[]) => {
  const response = await axios.post(`${API_URL}/exams/bulk`, { name: examName, questions });
  return response.data;
};

export const fetchExams = async () => {
  const response = await axios.get<Exam[]>(`${API_URL}/exams`);
  return response.data;
};

export const fetchExamWithQuestions = async (examId: string) => {
  const response = await axios.get<PublicExam>(`${API_URL}/exams/${examId}/full`);
  return response.data;
};

export const createExam = async (data: {
  name: string;
  questionIds: string[];
  negativeMark: number;
  timeLimit: number;
}) => {
  const response = await axios.post<Exam>(`${API_URL}/exams`, data);
  return response.data;
};

// Attempt APIs
export const startExamAttempt = async (examId: string, negativeMark?: number, timeLimit?: number) => {
  const response = await axios.post<ExamResponse>(`${API_URL}/attempts`, { 
    examId,
    negativeMark,
    timeLimit 
  });
  return response.data;
};

export const submitAttempt = async (attemptId: string, answers: AnswerMap) => {
  const response = await axios.put<AttemptResultResponse>(
    `${API_URL}/attempts/${attemptId}/finish`,
    { answers }
  );
  return response.data;
};

export const fetchAttemptResults = async (attemptId: string) => {
  const response = await axios.get<AttemptResultResponse>(`${API_URL}/attempts/${attemptId}`);
  return response.data;
};

export const fetchUserAttempts = async () => {
  const response = await axios.get(`${API_URL}/attempts/user/me`);
  return response.data;
};

// WebSocket connection for exam timer
export const connectToExamTimer = (
  attemptId: string,
  timeLimit: number,
  onTick: (remainingSeconds: number) => void,
  onFinish: () => void
) => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${wsProtocol}//${host}/ws?attemptId=${attemptId}&timeLimit=${timeLimit}`;
  
  const ws = new WebSocket(wsUrl);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'TICK') {
      onTick(data.remainingSeconds);
    } else if (data.type === 'FINISH') {
      onFinish();
    }
  };
  
  ws.onclose = () => {
    console.log('WebSocket connection closed');
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  const sendPartialSubmission = (answers: AnswerMap) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'SUBMIT',
        answers
      }));
    }
  };
  
  return {
    close: () => ws.close(),
    sendPartialSubmission
  };
};
