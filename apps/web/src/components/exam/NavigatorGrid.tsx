import { Box, Button, CircularProgress, Grid, Typography } from '@mui/material';
import { FC } from 'react';
import { AnswerMap } from 'shared/src/models';

// Define valid button colors
type ButtonColorType = 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' | 'inherit' | undefined;

interface NavigatorGridProps {
  totalQuestions: number;
  currentQuestion: number;
  answers: AnswerMap;
  questions: Array<{ _id: string }>;
  onSelect: (index: number) => void;
  correctAnswers?: AnswerMap; // For results view
  reviewMode?: boolean;
}

const NavigatorGrid: FC<NavigatorGridProps> = ({
  totalQuestions,
  currentQuestion,
  answers,
  questions = [], // Ensure questions has a default empty array
  onSelect,
  correctAnswers,
  reviewMode = false,
}) => {
  // Generate button color based on answer status
  const getButtonColor = (index: number): ButtonColorType => {
    // Safety check for questions array
    if (!questions || !questions[index]) return 'inherit';

    const questionId = questions[index]._id;
    if (!questionId) return 'inherit';

    // Safety check for answers object
    if (!answers) return 'inherit';

    const answered = answers[questionId];

    if (reviewMode && correctAnswers) {
      if (!answered) return 'inherit'; // Not answered
      if (answered === correctAnswers[questionId]) return 'success'; // Correct
      return 'error'; // Incorrect
    }

    return answered ? 'primary' : 'inherit';
  };

  // Generate grid of question buttons
  const renderQuestionButtons = () => {
    // If questions aren't loaded yet, show a loading indicator
    if (!questions || questions.length === 0) {
      return (
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        </Grid>
      );
    }

    const buttons = [];

    for (let i = 0; i < totalQuestions; i++) {
      const buttonColor = getButtonColor(i);

      buttons.push(
        <Grid item xs={2} key={i}>
          <Button
            variant={currentQuestion === i ? 'contained' : 'outlined'}
            color={buttonColor}
            onClick={() => onSelect(i)}
            sx={{
              minWidth: '36px',
              height: '36px',
              p: 0,
              borderRadius: '50%',
            }}
          >
            {i + 1}
          </Button>
        </Grid>
      );
    }

    return buttons;
  };

  // Generate summary of answers
  const getAnswerSummary = () => {
    if (!questions || !questions.length) return { answered: 0, unanswered: totalQuestions, correct: 0, incorrect: 0 };
    if (!answers) return { answered: 0, unanswered: totalQuestions, correct: 0, incorrect: 0 };

    let answered = 0;
    let unanswered = 0;
    let correct = 0;
    let incorrect = 0;

    questions.forEach((q) => {
      // Skip if question is undefined or missing _id
      if (!q || !q._id) {
        unanswered++;
        return;
      }

      const answer = answers[q._id];

      if (!answer) {
        unanswered++;
        return;
      }

      answered++;

      if (reviewMode && correctAnswers) {
        if (answer === correctAnswers[q._id]) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });

    return { answered, unanswered, correct, incorrect };
  };

  const summary = getAnswerSummary();

  return (
    <Box>
      {/* Summary statistics */}
      <Box sx={{ mb: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Answered:</strong> {summary.answered} / {totalQuestions}
        </Typography>

        <Typography variant="body2">
          <strong>Unanswered:</strong> {summary.unanswered}
        </Typography>

        {reviewMode && (
          <>
            <Typography variant="body2" color="success.main">
              <strong>Correct:</strong> {summary.correct}
            </Typography>
            <Typography variant="body2" color="error.main">
              <strong>Incorrect:</strong> {summary.incorrect}
            </Typography>
          </>
        )}
      </Box>

      {/* Question grid */}
      <Grid container spacing={1}>
        {renderQuestionButtons()}
      </Grid>

      {/* Legend */}
      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
          Legend:
        </Typography>

        <Grid container spacing={1} alignItems="center">
          <Grid item>
            <Box sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: '1px solid',
              borderColor: 'primary.main',
              bgcolor: 'transparent'
            }} />
          </Grid>
          <Grid item><Typography variant="caption">Unanswered</Typography></Grid>

          <Grid item>
            <Box sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: 'primary.main'
            }} />
          </Grid>
          <Grid item><Typography variant="caption">Answered</Typography></Grid>

          {reviewMode && (
            <>
              <Grid item>
                <Box sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: 'success.main'
                }} />
              </Grid>
              <Grid item><Typography variant="caption">Correct</Typography></Grid>

              <Grid item>
                <Box sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: 'error.main'
                }} />
              </Grid>
              <Grid item><Typography variant="caption">Incorrect</Typography></Grid>
            </>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default NavigatorGrid;
