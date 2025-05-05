import { Box, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Paper, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavigatorGrid from '../components/exam/NavigatorGrid';
import QuestionCard from '../components/exam/QuestionCard';
import TimerBar from '../components/exam/TimerBar';
import { connectToExamTimer, fetchExamWithQuestions, startExamAttempt, submitAttempt } from '../services/api';
import { formatRemainingTime, getAnsweredCount, useExamSessionStore } from '../store/examSessionStore';

const ExamRunner = () => {
  const { id: examId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State from Zustand store
  const {
    exam, answers, remaining, isStarted, isFinished, attemptId,
    setExam, startExam, finishExam, resetSession, updateTimer,
    negativeMark, timeLimit // Get these from the store now
  } = useExamSessionStore();

  // Local state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate stats
  const totalQuestions = exam?.questions?.length || 0;
  const answeredCount = getAnsweredCount(answers);

  // Initialize the exam
  useEffect(() => {
    const initExam = async () => {
      try {
        // Fetch exam data if not loaded
        if (!exam && examId) {
          const examData = await fetchExamWithQuestions(examId);
          setExam(examData);
        }

        // Start a new attempt if not started
        if (!isStarted && examId && !attemptId) {
          const { attemptId: newAttemptId, wsToken } = await startExamAttempt(examId, negativeMark, timeLimit);
          startExam(newAttemptId, wsToken);
        }
      } catch (error: any) {
        setError(error.message || 'Failed to initialize exam');
      }
    };

    initExam();
  }, [examId, exam, isStarted, attemptId, negativeMark, timeLimit, setExam, startExam]);

  // WebSocket connection for timer
  useEffect(() => {
    if (isStarted && attemptId && timeLimit && !isFinished) {
      const connection = connectToExamTimer(
        attemptId,
        timeLimit, // minutos
        (remainingSeconds) => {
          updateTimer(remainingSeconds); // función que actualiza el estado del contador
        },
        () => {
          finishExam();        // marca el examen como terminado
          handleSubmitExam(); // envía las respuestas
        }
      );

      // Set up auto-save every 30 seconds
      const autoSaveInterval = setInterval(() => {
        connection.sendPartialSubmission(answers);
      }, 30000);

      return () => {
        connection.close();
        clearInterval(autoSaveInterval);
      };
    }
  }, [isStarted, attemptId, timeLimit, isFinished, updateTimer, answers, finishExam]);

  // Auto-navigate to results when finished
  useEffect(() => {
    if (isFinished && attemptId && examId) {
      navigate(`/exam/${examId}/result/${attemptId}`);
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
    if (!attemptId || !examId) return;

    try {
      setIsSubmitting(true);
      await submitAttempt(attemptId, answers);
      finishExam();
      navigate(`/exam/${examId}/result/${attemptId}`);
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
  if (!exam || !exam.questions) {
    return (
      <Container>
        <Typography variant="h4" sx={{ mt: 4, textAlign: 'center' }}>
          Loading exam...
        </Typography>
      </Container>
    );
  }

  // Get current question
  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}

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
              onAnswerSelect={(answer) => {
                useExamSessionStore.getState().setAnswer(currentQuestion._id, answer);
              }}
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
