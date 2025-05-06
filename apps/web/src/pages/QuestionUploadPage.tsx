import {
  Alert,
  Box, Button,
  CircularProgress,
  Container,
  List, ListItem, ListItemText,
  Paper,
  Typography
} from '@mui/material';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { bulkImportQuestions } from '../services/api';

const QuestionUploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    maxFiles: 1
  });

  const validateQuestions = (questions: any[]): string | null => {
    if (!Array.isArray(questions)) {
      return 'Invalid file format: content must be an array';
    }



    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text || !q.options || !q.correct || !q.topic || !q.explanation) {
        return `Question ${i + 1} is missing required fields`;
      }

      if (!q.options.A || !q.options.B || !q.options.C || !q.options.D) {
        return `Question ${i + 1} is missing one or more options`;
      }

      if (!['A', 'B', 'C', 'D'].includes(q.correct)) {
        return `Question ${i + 1} has invalid correct answer: ${q.correct}`;
      }
    }

    return null;
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const content = await file.text();
      const questions = JSON.parse(content);

      // Validate questions
      const validationError = validateQuestions(questions);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Upload questions
      await bulkImportQuestions(questions);
      setSuccess(true);

      // Navigate back to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to import questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Import Questions
        </Typography>

        <Paper sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Requirements:
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="JSON file containing questions"
                secondary="The file must be in the correct format with all required fields"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Each question must have:"
                secondary={`
                  - text: Question text (supports Markdown)
                  - options: { A, B, C, D }
                  - correct: One of "A", "B", "C", "D"
                  - topic: Topic/category name
                  - explanation: Explanation for the correct answer
                `}
              />
            </ListItem>
          </List>

          {/* Dropzone */}
          <Box
            {...getRootProps()}
            sx={{
              mt: 3,
              p: 3,
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              borderRadius: 1,
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <Typography>Drop the JSON file here...</Typography>
            ) : (
              <Typography>
                Drag and drop a JSON file here, or click to select a file
              </Typography>
            )}
          </Box>

          {file && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                Selected file: {file.name}
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Questions imported successfully! Redirecting...
            </Alert>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!file || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Upload Questions'}
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default QuestionUploadPage;
