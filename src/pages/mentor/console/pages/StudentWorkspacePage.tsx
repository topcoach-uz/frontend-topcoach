import { Alert, Spin } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetMentorRosterQuery,
  useGetStudentGoalQuery,
} from 'src/app/services/fullSupportApi';
import StudentWorkspace, { type WorkspaceStudent } from '../components/StudentWorkspace';
import { useMentorMentees } from '../sessionSources';
import { initialsFromName } from '../utils';
import '../components/StudentWorkspace.scss';

export default function MentorStudentWorkspacePage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { data, isLoading } = useGetMentorRosterQuery();
  const { data: goalRes } = useGetStudentGoalQuery(id, { skip: !id });
  const { mentees, isLoading: menteesLoading } = useMentorMentees();

  // A student can reach this page from the Full Support roster or from the
  // 1:1 mentee list. Prefer the richer Full Support record; otherwise build a
  // workspace student from the mentee's session history.
  const rosterStudent = (data?.data ?? []).find((r) => r.id === id) ?? null;
  const mentee = mentees.find((m) => m.id === id) ?? null;
  const isFullSupport = !!rosterStudent;
  const student: WorkspaceStudent | null = rosterStudent
    ? rosterStudent
    : mentee
      ? {
          id: mentee.id,
          name: mentee.name,
          initials: initialsFromName(mentee.name),
          used: 0,
          allocated: 0,
          sessionsCount: mentee.sessionsCount,
        }
      : null;

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

  if (isLoading || menteesLoading) {
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

      <StudentWorkspace
        student={student}
        isFullSupport={isFullSupport}
        identityDetails={
          goalSegments.length > 0 && (
            <div className="mc-ws-identity-goal">
              {goalSegments.map((seg, i) => (
                <span key={seg.label}>
                  {i > 0 ? ' · ' : ''}
                  <span className="mc-ws-identity-goal-label">{seg.label}:</span> {seg.value}
                </span>
              ))}
            </div>
          )
        }
      />
    </div>
  );
}
