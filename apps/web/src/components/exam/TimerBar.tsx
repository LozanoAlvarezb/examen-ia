import { FC, useEffect, useState } from 'react';
import { Box, Paper, LinearProgress, Typography, useTheme } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface TimerBarProps {
  remainingTime: number; // in seconds
  formatTime: (seconds: number) => string;
  totalQuestions: number;
  answeredCount: number;
}

const TimerBar: FC<TimerBarProps> = ({
  remainingTime,
  formatTime,
  totalQuestions,
  answeredCount,
}) => {
  const theme = useTheme();
  const [isWarning, setIsWarning] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  
  // Calculate progress
  const progressPercentage = (answeredCount / totalQuestions) * 100;
  
  // Timer color based on remaining time
  useEffect(() => {
    // Less than 5 minutes: warning
    setIsWarning(remainingTime <= 300);
    // Less than 1 minute: urgent
    setIsUrgent(remainingTime <= 60);
  }, [remainingTime]);
  
  // Get color based on time state
  const getTimerColor = () => {
    if (isUrgent) return theme.palette.error.main;
    if (isWarning) return theme.palette.warning.main;
    return theme.palette.primary.main;
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{
        p: 1.5,
        mb: 2,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: isUrgent ? 'error.light' : 'background.paper',
        transition: 'background-color 0.3s'
      }}
    >
      {/* Timer */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        color: getTimerColor(),
        animation: isUrgent ? 'pulse 1s infinite' : 'none',
        '@keyframes pulse': {
          '0%': { opacity: 1 },
          '50%': { opacity: 0.6 },
          '100%': { opacity: 1 },
        }
      }}>
        <AccessTimeIcon sx={{ mr: 1 }} />
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
        >
          {formatTime(remainingTime)}
        </Typography>
      </Box>
      
      {/* Progress */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        flexGrow: 1,
        mx: { sm: 4 },
        mt: { xs: 1, sm: 0 },
        width: { xs: '100%', sm: 'auto' }
      }}>
        <Box sx={{ mr: 1 }}>
          <CheckCircleIcon color="success" />
        </Box>
        <Box sx={{ width: '100%' }}>
          <LinearProgress 
            variant="determinate" 
            value={progressPercentage} 
            sx={{ height: 10, borderRadius: 1 }}
          />
        </Box>
      </Box>
      
      {/* Question count */}
      <Typography sx={{ ml: { sm: 2 }, mt: { xs: 1, sm: 0 } }}>
        <strong>{answeredCount}</strong> / {totalQuestions} answered
      </Typography>
    </Paper>
  );
};

export default TimerBar;
