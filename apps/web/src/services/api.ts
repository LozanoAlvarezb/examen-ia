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
  // Important: Point directly to the backend server (port 4000)
  // instead of relying on the proxy which might be causing issues
  const wsUrl = `ws://localhost:4000/ws?attemptId=${attemptId}&timeLimit=${timeLimit}`;

  console.log('Connecting WebSocket directly to backend:', wsUrl);

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('WebSocket connection established successfully');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'TICK') {
        onTick(data.remainingSeconds);
      } else if (data.type === 'FINISH') {
        onFinish();
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.onclose = (event) => {
    console.log('WebSocket connection closed', event.code, event.reason);

    // If closed unexpectedly (not a normal closure)
    if (event.code !== 1000) {
      // Create and dispatch a custom event for the reconnection logic to catch
      const errorEvent = new CustomEvent('websocketerror', {
        detail: {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        }
      });
      window.dispatchEvent(errorEvent);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);

    // Create and dispatch a custom event for the reconnection logic to catch
    const errorEvent = new CustomEvent('websocketerror', {
      detail: { error }
    });
    window.dispatchEvent(errorEvent);
  };

  const sendPartialSubmission = (answers: AnswerMap) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'SUBMIT',
        answers
      }));
    } else {
      console.warn('WebSocket not open, cannot send partial submission');
    }
  };

  return {
    close: () => {
      try {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close(1000, "Closed normally");
        }
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
    },
    sendPartialSubmission
  };
};
