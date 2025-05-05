import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Grid, Card, CardContent, CardActions, 
  Button, Box, Chip, CircularProgress, Paper 
} from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import WarningIcon from '@mui/icons-material/Warning';
import { fetchExams } from '../services/api';

interface Exam {
  _id: string;
  name: string;
  timeLimit: number;
  negativeMark: number;
}

const HomePage = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadExams = async () => {
      try {
        const data = await fetchExams();
        setExams(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load exams');
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, []);

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
        <Paper sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="h6">Error Loading Exams</Typography>
          <Typography>{error}</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Available Exams
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select an exam to begin. Make sure you have enough time to complete the exam in one sitting.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {exams.map((exam) => (
          <Grid item xs={12} sm={6} md={4} key={exam._id}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {exam.name}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TimerIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">
                      Time Limit: {exam.timeLimit} minutes
                    </Typography>
                  </Box>

                  {exam.negativeMark > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
                      <Typography variant="body2">
                        Negative Marking: -{exam.negativeMark} per wrong answer
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Chip 
                    label="100 Questions" 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
              </CardContent>

              <CardActions>
                <Button 
                  fullWidth 
                  variant="contained" 
                  onClick={() => navigate(`/exam/${exam._id}`)}
                >
                  Start Exam
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {exams.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No exams available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use the bulk import feature to add exam questions
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Import Questions Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="outlined" 
          size="large"
          onClick={() => navigate('/admin/questions')}
        >
          Import Questions
        </Button>
      </Box>
    </Container>
  );
};

export default HomePage;
