import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, Typography, Paper, Container, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { fetchExamWithQuestions, startExamAttempt, submitAttempt, connectToExamTimer } from '../services/api';
import { useExamSessionStore, formatRemainingTime, getAnsweredCount } from '../store/examSessionStore';
import QuestionCard from '../components/exam/QuestionCard';
import NavigatorGrid from '../components/exam/NavigatorGrid';
import TimerBar from '../components/exam/TimerBar';

const ExamRunner = () => {
  const { id: examId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State from Zustand store
  const { 
    exam, answers, remaining, isStarted, isFinished, attemptId,
    setExam, startExam, finishExam, resetSession, updateTimer 
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
          const { attemptId: newAttemptId, wsToken } = await startExamAttempt(examId);
          startExam(newAttemptId, wsToken);
        }
      } catch (error: any) {
        setError(error.message || 'Failed to initialize exam');
      }
    };
    
    initExam();
  }, [examId, exam, isStarted, attemptId, setExam, startExam]);
  
  // WebSocket connection for timer
  useEffect(() => {
    if (isStarted && attemptId && exam?.timeLimit && !isFinished) {
      const wsToken = useExamSessionStore.getState().wsToken;
      
      if (!wsToken) return;
      
      const connection = connectToExamTimer(
        attemptId,
        wsToken,
        // On timer tick
        (remainingSeconds) => {
          updateTimer(remainingSeconds);
        },
        // On forced finish by server
        () => {
          finishExam();
          handleSubmitExam();
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
  }, [isStarted, attemptId, exam?.timeLimit, isFinished, updateTimer, answers, finishExam]);
  
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
