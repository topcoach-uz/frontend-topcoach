import { Alert, Spin } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetMentorPipelineQuery,
  useGetMentorRosterQuery,
  useGetStudentGoalQuery,
} from 'src/app/services/fullSupportApi';
import StudentWorkspace from '../components/StudentWorkspace';
import { avatarStyleForId, initialsFromName } from '../utils';
import '../components/StudentWorkspace.scss';

export default function MentorStudentWorkspacePage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { data, isLoading } = useGetMentorRosterQuery();
  const { data: pipelineRes } = useGetMentorPipelineQuery();
  const { data: goalRes } = useGetStudentGoalQuery(id, { skip: !id });
  const student = (data?.data ?? []).find((r) => r.id === id) ?? null;

  // Mockup-style subtitle: "Oxford PPE · 9 sessions total" — the program comes
  // from the student's first essays/applications row when one exists.
  const program = useMemo(
    () => (pipelineRes?.data ?? []).find((p) => p.studentUserId === id && p.program)?.program,
    [pipelineRes?.data, id],
  );

  // "Goal: <career goal(s)> · Majors: <intended majors>" — the student's
  // self-declared goal (personal_profiles), shown only when present.
  const goalSegments = useMemo(() => {
    const goal = goalRes?.data;
    if (!goal) return [];
    const careerGoals = (goal.careerGoals ?? []).filter(Boolean);
    const majors = (goal.intendedMajors ?? [])
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .map((m) => m.major)
      .filter(Boolean);
    const segments: { label: string; value: string }[] = [];
    if (careerGoals.length > 0) segments.push({ label: 'Goal', value: careerGoals.join(', ') });
    if (majors.length > 0) segments.push({ label: 'Majors', value: majors.join(', ') });
    return segments;
  }, [goalRes?.data]);

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
          {goalSegments.length > 0 && (
            <div className="mc-ws-identity-goal">
              {goalSegments.map((seg, i) => (
                <span key={seg.label}>
                  {i > 0 ? ' · ' : ''}
                  <span className="mc-ws-identity-goal-label">{seg.label}:</span> {seg.value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <StudentWorkspace student={student} />
    </div>
  );
}
