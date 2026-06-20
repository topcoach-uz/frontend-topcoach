import React from 'react';
import { lazy } from 'react';

// Lazy load the programs landing page (card catalog)
const ProgramsLanding = lazy(() => import('./ProgramsLanding'));

const ProgramsPage: React.FC = () => {
  return <ProgramsLanding />;
};

export default ProgramsPage; 