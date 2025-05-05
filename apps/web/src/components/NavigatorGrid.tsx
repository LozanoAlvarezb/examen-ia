import { Box, Button, Grid, Tooltip } from '@mui/material';
import { AnswerMap } from 'shared/src/models';

interface NavigatorGridProps {
  totalQuestions: number;
  currentIndex: number;
  answers: AnswerMap;
  onSelect: (index: number) => void;
}

const NavigatorGrid = ({ totalQuestions, currentIndex, answers, onSelect }: NavigatorGridProps) => {
  // Create array of question indices (0-based)
  const questionIndices = Array.from({ length: totalQuestions }, (_, i) => i);
  
  // Determine button color based on answer status
  const getButtonColor = (index: number) => {
    const questionId = Object.keys(answers)[index];
    if (!questionId) return 'default';
    
    const answer = answers[questionId];
    if (answer === null) return 'default';
    return 'primary';
  };
  
  // Get button variant based on current selection
  const getButtonVariant = (index: number) => {
    return index === currentIndex ? 'contained' : 'outlined';
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={1}>
        {questionIndices.map((index) => (
          <Grid item key={index} xs={2} sm={1.5} md={1.5}>
            <Tooltip title={`Question ${index + 1}`} placement="top">
              <Button
                variant={getButtonVariant(index)}
                color={getButtonColor(index)}
                onClick={() => onSelect(index)}
                sx={{
                  minWidth: '32px',
                  width: '100%',
                  height: '32px',
                  p: 0,
                  fontSize: '0.75rem',
                }}
              >
                {index + 1}
              </Button>
            </Tooltip>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default NavigatorGrid;
