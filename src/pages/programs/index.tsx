import React from 'react';
import { lazy } from 'react';

// Lazy load the intensive mentorship program page
const IntensiveMentorshipProgram = lazy(() => import('./IntensiveMentorshipProgram'));

const ProgramsPage: React.FC = () => {
  return <IntensiveMentorshipProgram />;
};

export default ProgramsPage; 