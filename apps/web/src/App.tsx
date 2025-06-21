import { Box, CssBaseline } from '@mui/material';
import { Route, Routes } from 'react-router-dom';

// Layout components
import MainLayout from './components/layouts/MainLayout';

// Pages
import ExamIntro from './pages/ExamIntro';
import ExamResult from './pages/ExamResult';
import ExamRunner from './pages/ExamRunner';
import ExamUploadPage from './pages/ExamUploadPage';
import FocusIntro from './pages/FocusIntro';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import QuestionUploadPage from './pages/QuestionUploadPage';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Routes>
        {/* All routes with main layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="focus" element={<FocusIntro />} />
          <Route path="exam/:id" element={<ExamIntro />} />
          <Route path="exam/:id/start" element={<ExamRunner />} />
          <Route path="exam/attempt/:attemptId" element={<ExamRunner />} />
          <Route path="exam/:id/result/:attemptId" element={<ExamResult />} />
          <Route path="admin/questions" element={<QuestionUploadPage />} />
          <Route path="admin/exams" element={<ExamUploadPage />} />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Box>
  );
}

export default App;
