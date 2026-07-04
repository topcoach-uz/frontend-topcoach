import { Alert, Spin } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetMentorPipelineQuery,
  useGetMentorRosterQuery,
} from 'src/app/services/fullSupportApi';
import StudentWorkspace from '../components/StudentWorkspace';
import { avatarStyleForId, initialsFromName } from '../utils';
import '../components/StudentWorkspace.scss';

export default function MentorStudentWorkspacePage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { data, isLoading } = useGetMentorRosterQuery();
  const { data: pipelineRes } = useGetMentorPipelineQuery();
  const student = (data?.data ?? []).find((r) => r.id === id) ?? null;

  // Mockup-style subtitle: "Oxford PPE · 9 sessions total" — the program comes
  // from the student's first essays/applications row when one exists.
  const program = useMemo(
    () => (pipelineRes?.data ?? []).find((p) => p.studentUserId === id && p.program)?.program,
    [pipelineRes?.data, id],
  );

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
          <ArrowLeft size={15} /> All students
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

  return (
    <div>
      <button type="button" className="mc-ws-back" onClick={() => navigate('/mentor/students')}>
        <ArrowLeft size={15} /> All students
      </button>

      <div className="mc-ws-identity mc-ws-identity--hero">
        <div
          className="mc-avatar mc-ws-identity-avatar"
          style={avatarStyleForId(student.id)}
        >
          {initialsFromName(student.name)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="mc-ws-identity-name">{student.name}</div>
          <div className="mc-ws-identity-meta">
            {program ? `${program} · ` : ''}
            {student.sessionsCount} session{student.sessionsCount === 1 ? '' : 's'} total ·{' '}
            {student.used}h of {student.allocated}h used
          </div>
        </div>
      </div>

      <StudentWorkspace student={student} />
    </div>
  );
}
