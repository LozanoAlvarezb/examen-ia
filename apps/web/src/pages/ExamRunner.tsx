import { Box, Button, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Paper, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavigatorGrid from '../components/exam/NavigatorGrid';
import QuestionCard from '../components/exam/QuestionCard';
import TimerBar from '../components/exam/TimerBar';
import { connectToExamTimer, fetchAttemptWithQuestions, fetchExamWithQuestions, startExamAttempt, submitAttempt } from '../services/api';
import { formatRemainingTime, getAnsweredCount, useExamSessionStore } from '../store/examSessionStore';

const ExamRunner = () => {
  console.log('ExamRunner component rendered');
  const { id: examId, attemptId: urlAttemptId } = useParams<{ id?: string; attemptId?: string }>();
  const navigate = useNavigate();

  // State from Zustand store
  const {
    exam, answers, remaining, isStarted, isFinished, attemptId,
    setExam, startExam, finishExam, updateTimer,
    negativeMark, timeLimit // Get these from the store now
  } = useExamSessionStore();

  // Local state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Add a loading state

  // Calculate stats
  const totalQuestions = exam?.questions?.length || 0;
  const answeredCount = getAnsweredCount(answers);

  // Initialize the exam
  useEffect(() => {
    const initExam = async () => {
      setLoading(true);
      try {
        // Handle weak question attempt (from Focus Mode)
        if (urlAttemptId && !examId) {
          console.log('Loading weak question attempt...');
          const { attempt, questions } = await fetchAttemptWithQuestions(urlAttemptId);
          
          // Create a PublicExam-like structure
          const examData = {
            _id: attempt.examId || 'focus-mode',
            name: 'Focus Mode Practice',
            questions: questions,
            createdAt: new Date(attempt.startedAt)
          };
          
          setExam(examData);
          
          // Set the attempt as already started
          useExamSessionStore.setState({
            attemptId: urlAttemptId,
            isStarted: true,
            negativeMark: attempt.negativeMark,
            timeLimit: attempt.timeLimit,
            startTime: new Date(attempt.startedAt).getTime(),
            remaining: attempt.timeLimit * 60 // Will be updated by WebSocket
          });
        }
        // Handle regular exam
        else if (!exam && examId) {
          console.log('Fetching exam data...');
          const examData = await fetchExamWithQuestions(examId);
          setExam(examData);
        }

        // Start a new attempt if not started (only for regular exams)
        if (!isStarted && examId && !attemptId && !urlAttemptId) {
          console.log('Starting new attempt...');
          const { attemptId: newAttemptId, wsToken } = await startExamAttempt(examId, negativeMark, timeLimit);
          startExam(newAttemptId, wsToken);
        }
      } catch (error: any) {
        console.error('Error initializing exam:', error);
        setError(error.message || 'Failed to initialize exam');
      } finally {
        setLoading(false);
      }
    };

    initExam();
  }, [examId, urlAttemptId, exam, isStarted, attemptId, negativeMark, timeLimit, setExam, startExam]);

  // WebSocket connection for timer
  useEffect(() => {
    if (isStarted && attemptId && timeLimit && !isFinished) {
      console.log('Connecting to timer...');
      let retryCount = 0;
      const maxRetries = 3;
      let retryTimeout: NodeJS.Timeout;

      function connectWebSocket() {
        const connection = connectToExamTimer(
          attemptId,
          timeLimit,
          (remainingSeconds) => {
            updateTimer(remainingSeconds);
          },
          () => {
            finishExam();
            handleSubmitExam();
          }
        );

        // Set up auto-save every 30 seconds
        const autoSaveInterval = setInterval(() => {
          if (connection) {
            try {
              // Get the latest answers from the store
              const currentAnswers = useExamSessionStore.getState().answers;
              connection.sendPartialSubmission(currentAnswers);
            } catch (error) {
              console.error('Failed to send partial submission:', error);
            }
          }
        }, 30000);

        // Return cleanup function
        return () => {
          if (connection) connection.close();
          clearInterval(autoSaveInterval);
          if (retryTimeout) clearTimeout(retryTimeout);
        };
      }

      // Function to handle WebSocket reconnection
      const handleReconnect = () => {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Attempting to reconnect WebSocket: Attempt ${retryCount} of ${maxRetries}`);
          const delay = Math.min(1000 * 2 ** retryCount, 30000); // Exponential backoff with 30s max
          retryTimeout = setTimeout(() => {
            cleanup = connectWebSocket();
          }, delay);
        } else {
          console.error('Maximum WebSocket reconnection attempts reached');
          setError('Failed to connect to exam timer. Please try refreshing the page.');
        }
      };

      // Listen for WebSocket errors globally to detect disconnections
      const handleWSError = () => {
        handleReconnect();
      };

      // Add and remove global event listener
      window.addEventListener('websocketerror', handleWSError);

      // Initial connection
      let cleanup = connectWebSocket();

      return () => {
        cleanup();
        window.removeEventListener('websocketerror', handleWSError);
      };
    }
  }, [isStarted, attemptId, timeLimit, isFinished, updateTimer, finishExam]);

  // Auto-navigate to results when finished
  useEffect(() => {
    if (isFinished && attemptId) {
      // For weak question attempts, use a different route or the same with examId as 'focus'
      const examIdForRoute = examId || 'focus';
      navigate(`/exam/${examIdForRoute}/result/${attemptId}`);
    }
  }, [isFinished, attemptId, examId, navigate]);

  // Handle navigation between questions
  const handleNavigate = useCallback((index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
    }
  }, [totalQuestions]);

  // Handle exam submission
  const handleSubmitExam = async () => {
    if (!attemptId) return;

    try {
      setIsSubmitting(true);
      await submitAttempt(attemptId, answers);
      finishExam();
      // For weak question attempts, use 'focus' as examId in route
      const examIdForRoute = examId || 'focus';
      navigate(`/exam/${examIdForRoute}/result/${attemptId}`);
    } catch (error: any) {
      setError(error.message || 'Failed to submit exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm before finishing exam
  const handleFinishClick = () => {
    setShowFinishDialog(true);
  };

  // Render loading state
  if (loading) {
    return (
      <Container sx={{ py: 5, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h5" sx={{ mt: 3 }}>
          Loading exam...
        </Typography>
      </Container>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Container sx={{ py: 5 }}>
        <Paper sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="h5" gutterBottom>Error Loading Exam</Typography>
          <Typography>{error}</Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate('/')}
          >
            Return to Home
          </Button>
        </Paper>
      </Container>
    );
  }

  // Handle case when exam data is not available
  if (!exam || !exam.questions || exam.questions.length === 0) {
    return (
      <Container sx={{ py: 5, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Exam data is not available or has no questions
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 3 }}
          onClick={() => navigate('/')}
        >
          Return to Home
        </Button>
      </Container>
    );
  }

  // Get current question
  const currentQuestion = exam.questions[currentQuestionIndex];

  // Function to handle answer selection
  const handleAnswerSelect = (answer: 'A' | 'B' | 'C' | 'D' | null) => {
    // Save the answer
    useExamSessionStore.getState().setAnswer(currentQuestion._id, answer);

    // Automatically navigate to next question if not the last question
    if (currentQuestionIndex < totalQuestions - 1) {
      setTimeout(() => {
        handleNavigate(currentQuestionIndex + 1);
      }, 500); // Small delay for better UX
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <TimerBar
        remainingTime={remaining}
        formatTime={formatRemainingTime}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
      />

      <Grid container spacing={2}>
        {/* Question display */}
        <Grid item xs={12} md={8}>
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              selectedAnswer={answers[currentQuestion._id] || null}
              onAnswerSelect={handleAnswerSelect}
            />
          )}

          {/* Navigation buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              variant="outlined"
              disabled={currentQuestionIndex === 0}
              onClick={() => handleNavigate(currentQuestionIndex - 1)}
            >
              Previous
            </Button>

            <Button
              variant="contained"
              color="success"
              onClick={handleFinishClick}
            >
              Finish Exam
            </Button>

            <Button
              variant="outlined"
              disabled={currentQuestionIndex === totalQuestions - 1}
              onClick={() => handleNavigate(currentQuestionIndex + 1)}
            >
              Next
            </Button>
          </Box>
        </Grid>

        {/* Question navigator */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Question Navigator
            </Typography>
            <NavigatorGrid
              totalQuestions={totalQuestions}
              currentQuestion={currentQuestionIndex}
              answers={answers}
              questions={exam.questions}
              onSelect={handleNavigate}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Finish confirmation dialog */}
      <Dialog open={showFinishDialog} onClose={() => setShowFinishDialog(false)}>
        <DialogTitle>Confirm Submission</DialogTitle>
        <DialogContent>
          <Typography>
            You have answered {answeredCount} out of {totalQuestions} questions.
            {answeredCount < totalQuestions &&
              ` Are you sure you want to submit? You still have ${totalQuestions - answeredCount} unanswered questions.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowFinishDialog(false)}
            variant="outlined"
          >
            Continue Exam
          </Button>
          <Button
            onClick={handleSubmitExam}
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Exam'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ExamRunner;
