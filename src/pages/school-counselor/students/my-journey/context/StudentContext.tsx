import React, { createContext, useContext } from 'react';

interface StudentContextValue {
  studentId: string;
  readOnly: boolean;
}

export const StudentContext = createContext<StudentContextValue | undefined>(undefined);

export const useStudentContext = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudentContext must be used within StudentContext.Provider');
  }
  return context;
};

