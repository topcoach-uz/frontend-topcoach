import React, { createContext, useContext, useMemo } from 'react';
import { useGetMeQuery } from 'src/app/services/users';
import { useTypedSelector } from 'src/app/store';

export type ManagementRoleLiteral = 'Owner' | 'SuperAdmin' | string | undefined;

export type AdminConsoleContextValue = {
  role: ManagementRoleLiteral;
  currentUserEmail: string | undefined;
  actorDisplayName: string;
};

const AdminConsoleContext = createContext<AdminConsoleContextValue | null>(null);

export function AdminConsoleProvider({ children }: { children: React.ReactNode }) {
  const user = useTypedSelector((state) => state.auth.profile);
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const { data: userData } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const current = userData || user;
  const role = current?.managementRole as ManagementRoleLiteral;

  const actorDisplayName = useMemo(() => {
    const name = (current as { profile?: { name?: string } } | undefined)?.profile?.name?.trim();
    if (name) return name;
    const email = current?.email?.trim();
    if (email && email.includes('@')) return email.split('@')[0] ?? email;
    return email ?? 'Admin';
  }, [current]);

  const value = useMemo(
    () => ({
      role,
      currentUserEmail: current?.email,
      actorDisplayName,
    }),
    [role, current?.email, actorDisplayName],
  );

  return <AdminConsoleContext.Provider value={value}>{children}</AdminConsoleContext.Provider>;
}

export function useAdminConsole() {
  const ctx = useContext(AdminConsoleContext);
  if (!ctx) {
    throw new Error('useAdminConsole must be used within AdminConsoleProvider');
  }
  return ctx;
}
