// Custom hooks for read-only Student Hub views (for school counselors/superadmins)
import { useMemo } from 'react';
import { useStudentContext } from '../pages/school-counselor/students/my-journey/context/StudentContext';
import { useGetStudentProfileQuery } from '../app/services/student-hub/studentProfileApi';
import { StudentProfile } from '../app/services/student-hub/types';

/**
 * Hook to get student profile data, either for current user or for a specific student (read-only mode)
 */
export const useStudentProfileReadOnly = () => {
  const context = useStudentContext();
  const isReadOnly = context?.readOnly || false;
  const studentId = context?.studentId;

  // If in read-only mode, fetch the specific student's profile
  const { data: profileResponse, isLoading, error, refetch } = useGetStudentProfileQuery(
    studentId || '',
    { skip: !isReadOnly || !studentId }
  );

  // Extract profile from API response (it's wrapped in ApiResponse)
  const profile: StudentProfile | undefined = useMemo(() => {
    if (!isReadOnly || !profileResponse) return undefined;
    return (profileResponse as any)?.data || profileResponse;
  }, [isReadOnly, profileResponse]);

  return {
    profile,
    isLoading,
    error,
    refetch,
    isReadOnly,
  };
};

