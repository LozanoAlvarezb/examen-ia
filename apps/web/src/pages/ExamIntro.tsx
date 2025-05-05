import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { fetchExamWithQuestions } from '../services/api';
import { useExamSessionStore } from '../store/examSessionStore';

const ExamIntro = () => {
  const { id: examId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setExam, resetSession } = useExamSessionStore();

  useEffect(() => {
    const loadExam = async () => {
      if (!examId) return;

      try {
        const examData = await fetchExamWithQuestions(examId);
        setExam(examData);
      } catch (err: any) {
        setError(err.message || 'Failed to load exam details');
      } finally {
        setLoading(false);
      }
    };

    resetSession();
    loadExam();
  }, [examId, setExam, resetSession]);

  const handleStartExam = () => {
    if (examId) {
      navigate(`/exam/${examId}/start`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const exam = useExamSessionStore.getState().exam;

  if (error || !exam) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Unable to load exam details'}
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          {exam.name}
        </Typography>

        <Paper sx={{ mt: 4, p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Important Instructions
          </Typography>

          <List sx={{ mt: 2 }}>
            <ListItem>
              <ListItemIcon>
                <TimerIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={`Time Limit: ${exam.timeLimit} minutes`}
                secondary="The exam will auto-submit when time runs out"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <WarningIcon color="warning" />
              </ListItemIcon>
              <ListItemText
                primary={`Negative Marking: ${exam.negativeMark} marks`}
                secondary="Points will be deducted for incorrect answers"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="100 Multiple Choice Questions"
                secondary="Each question has exactly one correct answer"
              />
            </ListItem>
          </List>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Before You Begin:
            </Typography>
            <List>
              <ListItem>
                <ListItemText primary="• Ensure you have a stable internet connection" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Your answers are auto-saved every 30 seconds" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• You can review and change answers before submitting" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Once submitted, you cannot retake the exam" />
              </ListItem>
            </List>
          </Box>

          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleStartExam}
            >
              Start Exam
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Return to Home
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ExamIntro;
