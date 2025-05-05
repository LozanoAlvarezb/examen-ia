import { Route, Routes, Navigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

// Layout components
import MainLayout from './components/layouts/MainLayout';

// Pages
import HomePage from './pages/HomePage';
import ExamIntro from './pages/ExamIntro';
import ExamRunner from './pages/ExamRunner';
import ExamResult from './pages/ExamResult';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import QuestionUploadPage from './pages/QuestionUploadPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected route component
const ProtectedRoute = ({ children, requiredRole = null }: { children: JSX.Element, requiredRole?: string | null }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // While checking authentication status, show nothing
  if (isLoading) {
    return null;
  }

  // Authentication check
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Role check (if required)
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Routes with main layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="exam/:id" element={<ExamIntro />} />
          <Route path="exam/:id/start" element={<ExamRunner />} />
          <Route path="exam/:id/result/:attemptId" element={<ExamResult />} />
          
          {/* Admin routes */}
          <Route 
            path="admin/questions" 
            element={
              <ProtectedRoute requiredRole="admin">
                <QuestionUploadPage />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Box>
  );
}

export default App;
