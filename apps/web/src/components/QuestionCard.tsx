import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  FormControl, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Box, 
  Paper
} from '@mui/material';
import { Answer } from 'shared/src/models';
import { marked } from 'marked';

interface QuestionCardProps {
  question: {
    _id: string;
    text: string;
    options: {
      A: string;
      B: string;
      C: string;
      D: string;
    };
  };
  answer: Answer;
  onAnswer: (questionId: string, answer: Answer) => void;
  index: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, answer, onAnswer, index }) => {
  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as Answer;
    onAnswer(question._id, value);
  };

  // Render markdown content safely
  const createMarkup = (content: string) => {
    return { __html: marked(content, { breaks: true }) };
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Question {index + 1}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {question._id}
          </Typography>
        </Box>

        <Paper 
          elevation={0} 
          sx={{ p: 2, mb: 3, backgroundColor: 'background.default' }}
        >
          <Typography
            variant="body1"
            dangerouslySetInnerHTML={createMarkup(question.text)}
          />
        </Paper>

        <FormControl component="fieldset" sx={{ width: '100%' }}>
          <RadioGroup
            name={`question-${question._id}`}
            value={answer || ''}
            onChange={handleAnswerChange}
          >
            {Object.entries(question.options).map(([key, value]) => (
              <FormControlLabel
                key={key}
                value={key}
                control={<Radio />}
                label={
                  <Box sx={{ pl: 1 }}>
                    <Typography 
                      component="span" 
                      dangerouslySetInnerHTML={createMarkup(value)} 
                    />
                  </Box>
                }
                sx={{ 
                  mb: 1,
                  p: 1, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  borderRadius: 1,
                  width: '100%',
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
