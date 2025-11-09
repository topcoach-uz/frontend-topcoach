import B2BRoutes from './B2BRoutes';
import B2BLayout from './components/B2BLayout';

const B2BPage = () => {
  // For now, allow access - later we'll add authentication
  return (
    <B2BLayout>
      <B2BRoutes />
    </B2BLayout>
  );
};

export default B2BPage;

