import { Link } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box } from '@mui/material';

const NotFoundPage = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh' 
      }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h1" color="primary" sx={{ fontSize: '4rem', mb: 2 }}>
            404
          </Typography>
          <Typography variant="h5" gutterBottom>
            Page Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            The page you are looking for does not exist or has been moved.
          </Typography>
          <Button 
            component={Link} 
            to="/" 
            variant="contained" 
            size="large"
          >
            Return to Home
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
