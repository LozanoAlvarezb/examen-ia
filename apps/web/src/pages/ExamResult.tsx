import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import NavigatorGrid from '../components/exam/NavigatorGrid';
import QuestionCard from '../components/exam/QuestionCard';
import { fetchAttemptResults } from '../services/api';

interface TopicScore {
  name: string;
  score: number;
}

interface ResultData {
  examName?: string;
  questions: Array<{
    _id: string;
    text: string;
    options: {
      A: string;
      B: string;
      C: string;
      D: string;
    };
    correct: 'A' | 'B' | 'C' | 'D';
    explanation: string;
    topic: string;
  }>;
  scoreTotal: number;
  scoreByTopic: Array<{ topic: string; score: number }>;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  answers: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  startedAt: string;
  finishedAt: string;
}

const ExamResult = () => {
  const { attemptId } = useParams<{ id: string; attemptId: string }>();
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        if (attemptId) {
          const data = await fetchAttemptResults(attemptId);
          setResult(data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load exam results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [attemptId]);

  // Format the topic scores for the bar chart with sorting
  const formatTopicScores = (scoreByTopic: Array<{ topic: string; score: number }> | undefined): TopicScore[] => {
    if (!scoreByTopic) return [];
    // Sort topics by score in descending order
    return scoreByTopic
      .map(({ topic, score }) => ({ name: topic, score }))
      .sort((a, b) => b.score - a.score);
  };

  // Calculate time taken in minutes
  const calculateTimeTaken = (start: string, end: string): number => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffMs = endTime - startTime;
    return Math.floor(diffMs / (1000 * 60)); // Convert ms to minutes
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !result) {
    return (
      <Container sx={{ py: 4 }}>
        <Paper sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="h5">Error Loading Results</Typography>
          <Typography>{error || 'Unable to load exam results'}</Typography>
          <Button component={Link} to="/" sx={{ mt: 2 }} variant="contained">
            Return to Home
          </Button>
        </Paper>
      </Container>
    );
  }

  const topicScores = formatTopicScores(result.scoreByTopic);
  const timeTaken = calculateTimeTaken(result.startedAt, result.finishedAt);
  const currentQuestion = result.questions[currentQuestionIndex];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Results header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {result.examName || 'Weak Questions'} - Results
        </Typography>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Your Score: {result.scoreTotal.toFixed(2)}%
              </Typography>
              <Typography>
                <strong>Correct Answers:</strong> {result.correctCount}
              </Typography>
              <Typography>
                <strong>Wrong Answers:</strong> {result.wrongCount}
              </Typography>
              <Typography>
                <strong>Unanswered:</strong> {result.blankCount}
              </Typography>
              <Typography>
                <strong>Time Taken:</strong> {timeTaken} minutes
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Performance by Topic
            </Typography>

            <Box sx={{ height: 300, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topicScores}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 30,
                    left: 100, // Extra space for topic names
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  <Bar
                    dataKey="score"
                    fill="#8884d8"
                    barSize={20}
                    label={{ position: 'right', formatter: (value: number) => `${value.toFixed(1)}%` }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Button variant="contained" component={Link} to="/">
            Back to Home
          </Button>
        </Box>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom>
        Review Questions
      </Typography>

      <Grid container spacing={2}>
        {/* Question display */}
        <Grid item xs={12} md={8}>
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              selectedAnswer={result.answers[currentQuestion._id] || null}
              correctAnswer={currentQuestion.correct}
              explanation={currentQuestion.explanation}
              showCorrectAnswer={true}
              onAnswerSelect={() => { }} // No-op in review mode
            />
          )}

          {/* Navigation buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              variant="outlined"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            >
              Previous
            </Button>

            <Button
              variant="outlined"
              disabled={currentQuestionIndex === result.questions.length - 1}
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            >
              Next
            </Button>
          </Box>
        </Grid>

        {/* Question navigator */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Questions Review
            </Typography>
            <NavigatorGrid
              totalQuestions={result.questions.length}
              currentQuestion={currentQuestionIndex}
              answers={result.answers}
              questions={result.questions}
              correctAnswers={result.questions.reduce((acc, q) => {
                acc[q._id] = q.correct;
                return acc;
              }, {} as Record<string, 'A' | 'B' | 'C' | 'D'>)}
              onSelect={setCurrentQuestionIndex}
              reviewMode={true}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ExamResult;
