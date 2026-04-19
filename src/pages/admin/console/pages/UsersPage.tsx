import { useMemo } from 'react';
import { Segmented } from 'antd';
import { useSearchParams } from 'react-router-dom';
import DirectoryPageContent from '../components/DirectoryPageContent';

type UsersTab = 'mentees' | 'mentors' | 'counselors' | 'admins';

const TAB_OPTIONS: { value: UsersTab; label: string }[] = [
  { value: 'mentees', label: 'Mentees' },
  { value: 'mentors', label: 'Mentors' },
  { value: 'counselors', label: 'Counselors' },
  { value: 'admins', label: 'Admins' },
];

export default function AdminConsoleUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = useMemo<UsersTab>(() => {
    const raw = searchParams.get('tab') as UsersTab | null;
    return raw && TAB_OPTIONS.some((o) => o.value === raw) ? raw : 'mentees';
  }, [searchParams]);

  const setTab = (next: UsersTab) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="ac-admin-page ac-users-page">
      <div className="ac-users-header">
        <div>
          <h1 className="ac-page-title">Users</h1>
          <p className="ac-page-lead">Search and manage mentees, mentors, counselors, and admins.</p>
        </div>
        <Segmented
          value={tab}
          onChange={(v) => setTab(v as UsersTab)}
          options={TAB_OPTIONS}
        />
      </div>

      <div style={{ height: 20 }} />

      <DirectoryPageContent variant={tab} />
    </div>
  );
}
