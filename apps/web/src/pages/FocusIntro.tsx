import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimerIcon from '@mui/icons-material/Timer';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Alert,
  Box,
  Button,
  Chip,
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
import { useNavigate } from 'react-router-dom';
import { fetchWeakQuestions, startWeakAttempt } from '../services/api';
import { useExamSessionStore } from '../store/examSessionStore';

const FocusIntro = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weakQuestions, setWeakQuestions] = useState<Array<{
    questionId: string;
    timesSeen: number;
    timesCorrect: number;
    successRate: number;
  }>>([]);
  const { resetSession } = useExamSessionStore();

  // State for negativeMark and timeLimit
  const [negativeMark, setNegativeMark] = useState(0.25);
  const [timeLimit, setTimeLimit] = useState(60); // Default 60 minutes for focus mode

  useEffect(() => {
    const loadWeakQuestions = async () => {
      try {
        const data = await fetchWeakQuestions();
        if (data.length === 0) {
          navigate('/');
          return;
        }
        setWeakQuestions(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load weak questions');
      } finally {
        setLoading(false);
      }
    };

    resetSession();
    loadWeakQuestions();
  }, [navigate, resetSession]);

  const handleStartPractice = async () => {
    try {
      const questionIds = weakQuestions.map(q => q.questionId);
      const response = await startWeakAttempt(questionIds, negativeMark, timeLimit);
      
      // Store session data similar to regular exam
      useExamSessionStore.setState({
        exam: {
          _id: 'focus-mode',
          name: 'Focus Mode Practice',
          questions: [], // Will be loaded in ExamRunner
          createdAt: new Date()
        },
        answers: {},
        startTime: Date.now(),
        remaining: timeLimit * 60,
        negativeMark,
        timeLimit
      });
      
      // Navigate to exam runner with attempt ID
      navigate(`/exam/attempt/${response.attemptId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start practice session');
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

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
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
          Focus Mode Practice
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Chip 
            label={`${weakQuestions.length} weak questions selected`} 
            color="warning" 
            sx={{ mr: 1 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            These are questions you got wrong or left blank in your recent attempts
          </Typography>
        </Box>

        <Paper sx={{ mt: 4, p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Practice Settings
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
              Duration of the practice session (10-240 minutes). The session will auto-submit when time runs out.
            </Typography>
          </Box>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Before You Begin
          </Typography>

          <List sx={{ mt: 2 }}>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Focus on understanding your mistakes"
                secondary="This is a learning opportunity to improve on your weak areas"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Take your time"
                secondary="Unlike regular exams, focus mode is about learning, not speed"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Questions will be removed as you improve"
                secondary="Once you answer correctly, questions won't appear in future focus sessions"
              />
            </ListItem>
          </List>

          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="warning"
              size="large"
              onClick={handleStartPractice}
              fullWidth
            >
              Start Practice Session
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/')}
              fullWidth
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default FocusIntro;