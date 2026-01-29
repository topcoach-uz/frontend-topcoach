import React, { createContext, useContext } from 'react';

interface StudentContextValue {
  studentId: string;
  readOnly: boolean;
  studentName?: string;
}

export const StudentContext = createContext<StudentContextValue | undefined>(undefined);

export const useStudentContext = () => {
  const context = useContext(StudentContext);
  // Return undefined if context doesn't exist (for normal Student Hub usage)
  // This allows the hook to be used both inside and outside the provider
  return context;
};

