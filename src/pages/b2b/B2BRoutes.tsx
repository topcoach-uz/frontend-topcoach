import { Routes, Route } from 'react-router-dom';
import DashboardPage from './dashboard';
import StudentsPage from './students';
import StudentDetailPage from './students/detail';
import CoursesPage from './courses';
import AnalyticsPage from './analytics';
import SettingsPage from './settings';

const B2BRoutes = () => {
  return (
    <Routes>
      <Route index element={<DashboardPage />} />
      <Route path="students" element={<StudentsPage />} />
      <Route path="students/:id" element={<StudentDetailPage />} />
      <Route path="courses" element={<CoursesPage />} />
      <Route path="analytics" element={<AnalyticsPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Routes>
  );
};

export default B2BRoutes;

