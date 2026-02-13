import { Routes, Route } from 'react-router-dom';
import DashboardPage from './dashboard';
import StudentsPage from './students';
import StudentDetailPage from './students/detail';
import StudentMyJourneyView from './students/my-journey';
// import CoursesPage from './courses'; // Hidden for now
import AnalyticsPage from './analytics';
import SettingsPage from './settings';

const SchoolCounselorRoutes = () => {
  return (
    <Routes>
      <Route index element={<DashboardPage />} />
      <Route path="students" element={<StudentsPage />} />
      <Route path="students/:id" element={<StudentDetailPage />} />
      <Route path="students/:id/my-journey" element={<StudentMyJourneyView />} />
      {/* <Route path="courses" element={<CoursesPage />} /> - Hidden for now */}
      <Route path="analytics" element={<AnalyticsPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Routes>
  );
};

export default SchoolCounselorRoutes;

