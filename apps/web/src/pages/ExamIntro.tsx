import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimerIcon from '@mui/icons-material/Timer';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Slider,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchExamWithQuestions } from '../services/api';
import { useExamSessionStore } from '../store/examSessionStore';

const ExamIntro = () => {
  console.log('ExamIntro component rendered');
  const { id: examId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setExam, resetSession } = useExamSessionStore();

  // Add state for negativeMark and timeLimit
  const [negativeMark, setNegativeMark] = useState(0.25);
  const [timeLimit, setTimeLimit] = useState(120);

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
      // Store negativeMark and timeLimit in the exam session store
      useExamSessionStore.setState(state => ({
        ...state,
        negativeMark,
        timeLimit
      }));
      navigate(`/exam/${examId}/start`);
    }
  };

  const handleNegativeMarkChange = (_event: Event, value: number | number[]) => {
    setNegativeMark(value as number);
  };

  const handleTimeLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 10 && value <= 240) {
      setTimeLimit(value);
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
            Exam Settings
          </Typography>

          <Box sx={{ mt: 3, mb: 4 }}>
            <Typography id="negative-mark-slider" gutterBottom>
              Negative Marking
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ mr: 2 }}>
                <WarningIcon color="warning" />
              </Box>
              <Box sx={{ width: '100%' }}>
                <Slider
                  value={negativeMark}
                  onChange={handleNegativeMarkChange}
                  aria-labelledby="negative-mark-slider"
                  step={0.05}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 0.25, label: '0.25' },
                    { value: 0.5, label: '0.5' },
                    { value: 1, label: '1' }
                  ]}
                  min={0}
                  max={1}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Points deducted for each incorrect answer. Set to 0 for no negative marking.
            </Typography>
          </Box>

          <Box sx={{ mt: 3, mb: 4 }}>
            <Typography gutterBottom>
              Time Limit (minutes)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ mr: 2 }}>
                <TimerIcon color="primary" />
              </Box>
              <TextField
                value={timeLimit}
                onChange={handleTimeLimitChange}
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">min</InputAdornment>,
                }}
                inputProps={{
                  min: 10,
                  max: 240,
                  step: 5
                }}
                fullWidth
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Duration of the exam (10-240 minutes). The exam will auto-submit when time runs out.
            </Typography>
          </Box>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Important Instructions
          </Typography>

          <List sx={{ mt: 2 }}>
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
