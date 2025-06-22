import {
  Badge,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip, CircularProgress,
  Container,
  Grid,
  IconButton,
  Paper,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Exam } from 'shared/src/models';
import { fetchExams, fetchWeakQuestions, deleteExam } from '../services/api';

const HomePage = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weakQuestionsCount, setWeakQuestionsCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load exams and weak questions count in parallel
        const [examsData, weakQuestionsData] = await Promise.all([
          fetchExams(),
          fetchWeakQuestions(1).catch(() => []) // Fetch only 1 to check if any exist
        ]);
        
        console.log('Exams data:', examsData); // Log to verify data structure
        setExams(examsData);
        setWeakQuestionsCount(weakQuestionsData.length);
      } catch (err: any) {
        setError(err.message || 'Failed to load exams');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleDeleteExam = async (examId: string, examName: string) => {
    if (!window.confirm(`Are you sure you want to delete the exam "${examName}"?`)) {
      return;
    }

    setDeleteLoading(examId);
    try {
      await deleteExam(examId);
      setExams(exams.filter(exam => exam._id !== examId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete exam');
    } finally {
      setDeleteLoading(null);
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
        {/* Focus Mode Card */}
        {weakQuestionsCount > 0 && (
          <Grid item xs={12} sm={6} md={4}>
            <Card elevation={3} sx={{ bgcolor: 'warning.light' }}>
              <CardContent>
                <Badge badgeContent={weakQuestionsCount} color="error">
                  <Typography variant="h6" gutterBottom>
                    Focus Mode
                  </Typography>
                </Badge>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Practice questions you got wrong or left blank in recent attempts
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={`${weakQuestionsCount} Weak Question${weakQuestionsCount > 1 ? 's' : ''}`}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  color="warning"
                  onClick={() => navigate('/focus')}
                >
                  Start Practice
                </Button>
              </CardActions>
            </Card>
          </Grid>
        )}

        {/* Regular Exam Cards */}
        {exams.map((exam) => (
          <Grid item xs={12} sm={6} md={4} key={exam._id}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" gutterBottom>
                    {exam.name}
                  </Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteExam(exam._id, exam.name)}
                    disabled={deleteLoading === exam._id}
                    sx={{ ml: 1 }}
                  >
                    {deleteLoading === exam._id ? <CircularProgress size={20} /> : <DeleteIcon />}
                  </IconButton>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={`${Array.isArray(exam.questionIds) ? exam.questionIds.length : '?'} Questions`}
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
                  disabled={deleteLoading === exam._id}
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

      {/* Import buttons */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate('/admin/questions')}
        >
          Import Questions
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/admin/exams')}
        >
          Import Exam
        </Button>
      </Box>
    </Container>
  );
};

export default HomePage;
