import { createContext, useContext, type ReactNode } from 'react';

export type MentorConsoleUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  managementRole: string | null;
  isMentor: boolean;
  isSuperAdmin: boolean;
  hasProgramLessons: boolean;
};

const MentorConsoleCtx = createContext<MentorConsoleUser | null>(null);

export function MentorConsoleProvider({
  value,
  children,
}: {
  value: MentorConsoleUser;
  children: ReactNode;
}) {
  return <MentorConsoleCtx.Provider value={value}>{children}</MentorConsoleCtx.Provider>;
}

export function useMentorConsole(): MentorConsoleUser {
  const ctx = useContext(MentorConsoleCtx);
  if (!ctx) {
    throw new Error('useMentorConsole must be used inside MentorConsoleProvider');
  }
  return ctx;
}
