import { FC } from 'react';
import { Card, CardContent, Typography, RadioGroup, FormControlLabel, Radio, Paper, Box } from '@mui/material';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Answer } from 'shared/src/models';

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
  questionNumber: number;
  selectedAnswer: Answer;
  onAnswerSelect: (answer: Answer) => void;
  showCorrectAnswer?: boolean;
  correctAnswer?: Answer;
  explanation?: string;
}

const QuestionCard: FC<QuestionCardProps> = ({
  question,
  questionNumber,
  selectedAnswer,
  onAnswerSelect,
  showCorrectAnswer = false,
  correctAnswer,
  explanation,
}) => {
  // Parse markdown for the question text and sanitize the HTML
  const renderMarkdown = (text: string) => {
    const html = marked(text);
    return { __html: DOMPurify.sanitize(html) };
  };

  // Generate answer background color
  const getAnswerColor = (option: Answer) => {
    if (!showCorrectAnswer) return 'transparent';
    
    if (option === correctAnswer) {
      return 'success.light'; // Correct answer - green
    } else if (option === selectedAnswer && option !== correctAnswer) {
      return 'error.light'; // Wrong answer - red
    }
    return 'transparent';
  };
  
  return (
    <Card elevation={3}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mr: 2 }}>
            Question {questionNumber}
          </Typography>
          
          {showCorrectAnswer && (
            <Typography 
              variant="body2" 
              sx={{ 
                bgcolor: selectedAnswer === correctAnswer ? 'success.main' : 'error.main',
                color: 'white',
                px: 2,
                py: 0.5,
                borderRadius: 1
              }}
            >
              {selectedAnswer === correctAnswer ? 'Correct' : 'Incorrect'}
            </Typography>
          )}
        </Box>
        
        <Typography 
          component="div" 
          dangerouslySetInnerHTML={renderMarkdown(question.text)}
          sx={{ mb: 3 }}
        />

        <RadioGroup
          value={selectedAnswer || ''}
          onChange={(e) => onAnswerSelect(e.target.value as Answer)}
        >
          {Object.entries(question.options).map(([optionKey, optionText]) => (
            <Paper 
              key={optionKey} 
              sx={{ 
                mb: 1, 
                p: 1,
                bgcolor: getAnswerColor(optionKey as Answer),
                transition: 'background-color 0.3s'
              }}
              elevation={1}
            >
              <FormControlLabel
                value={optionKey}
                control={<Radio />}
                label={
                  <Typography 
                    component="div" 
                    dangerouslySetInnerHTML={renderMarkdown(optionText)}
                  />
                }
                disabled={showCorrectAnswer}
                sx={{ width: '100%' }}
              />
            </Paper>
          ))}
        </RadioGroup>

        {showCorrectAnswer && explanation && (
          <Paper sx={{ mt: 3, p: 2, bgcolor: 'info.light' }}>
            <Typography variant="h6">Explanation:</Typography>
            <Typography 
              component="div" 
              dangerouslySetInnerHTML={renderMarkdown(explanation)}
            />
          </Paper>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
