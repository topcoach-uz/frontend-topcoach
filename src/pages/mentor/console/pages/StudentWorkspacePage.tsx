import { Alert, Button, Progress, Spin } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetMentorRosterQuery } from 'src/app/services/fullSupportApi';
import StudentWorkspace from '../components/StudentWorkspace';
import { avatarStyleForId, initialsFromName } from '../utils';
import '../components/StudentWorkspace.scss';

export default function MentorStudentWorkspacePage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { data, isLoading } = useGetMentorRosterQuery();
  const student = (data?.data ?? []).find((r) => r.id === id) ?? null;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!student) {
    return (
      <div>
        <button type="button" className="mc-ws-back" onClick={() => navigate('/mentor/students')}>
          <ArrowLeft size={15} /> Back to students
        </button>
        <Alert
          type="warning"
          showIcon
          message="Student not found"
          description="This student isn't on your roster, or the link is out of date."
        />
      </div>
    );
  }

  const hoursPct =
    student.allocated > 0
      ? Math.min(100, Math.round((student.used / student.allocated) * 100))
      : 0;

  return (
    <div>
      <button type="button" className="mc-ws-back" onClick={() => navigate('/mentor/students')}>
        <ArrowLeft size={15} /> Back to students
      </button>

      <div className="mc-page-head mc-page-head--ruled">
        <div className="mc-ws-identity">
          <div className="mc-avatar" style={{ ...avatarStyleForId(student.id), width: 48, height: 48, fontSize: 15 }}>
            {initialsFromName(student.name)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="mc-ws-identity-name">{student.name}</div>
            <div className="mc-ws-identity-meta">
              {student.used}h of {student.allocated}h used · {student.sessionsCount} sessions
            </div>
          </div>
          <Button onClick={() => navigate('/mentor/sessions')}>All sessions</Button>
        </div>
        <Progress
          percent={hoursPct}
          strokeColor="var(--mc-accent)"
          trailColor="var(--mc-border)"
          format={() => `${student.used}/${student.allocated}h`}
        />
      </div>

      <StudentWorkspace student={student} />
    </div>
  );
}
