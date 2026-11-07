import { useMemo, useState, type ReactNode } from 'react';
import { Button } from 'antd';
import {
  useRecordMentorLessonMutation,
  type SessionLogDto,
} from 'src/app/services/fullSupportApi';
import SessionReportModal from '../SessionReportModal';
import LessonRecordModal, { type LessonRecordInput } from '../LessonRecordModal';
import LiveAttendanceModal from 'src/pages/admin/courses/modules/LiveAttendanceModal';
import type { MentorBooking } from '../../sessionSources';

/**
 * Shared "finish a session" behaviour: the per-booking action buttons
 * (Write report / Record lesson / Edit lesson record / View report) plus the
 * modals they open. Used by the Schedule page and the student workspace.
 */
export function useSessionActions(options?: { onClassesChanged?: () => void }) {
  const [classBooking, setClassBooking] = useState<MentorBooking | null>(null);
  const [reportBooking, setReportBooking] = useState<MentorBooking | null>(null);
  const [recordBooking, setRecordBooking] = useState<MentorBooking | null>(null);
  const [recordLesson, { isLoading: recordingFs }] = useRecordMentorLessonMutation();

  /** Opens the right modal to finish this booking. */
  const openFinish = (b: MentorBooking) => {
    if (b.source === 'course-class') setClassBooking(b);
    else if (b.source === 'platform') setReportBooking(b);
    else setRecordBooking(b);
  };

  const saveLesson = async (input: LessonRecordInput) => {
    if (!recordBooking) return;
    await recordLesson({ id: (recordBooking.raw as SessionLogDto).id, ...input }).unwrap();
  };

  const recordValue = useMemo(() => {
    if (!recordBooking) return null;
    const record = recordBooking.raw as SessionLogDto;
    if (!record) return null;
    return {
      outcome: ['held', 'student_no_show', 'mentor_no_show', 'cancelled'].includes(record.outcome)
        ? (record.outcome as LessonRecordInput['outcome'])
        : ('held' as const),
      attendance: record.attendance === 'late' ? ('late' as const) : ('present' as const),
      actualDurationMinutes: record.actualDurationMinutes ?? recordBooking.durationMinutes,
      sharedNotes: record.sharedNotes,
    };
  }, [recordBooking]);

  /** Action buttons for one booking (may be empty). */
  const renderActions = (b: MentorBooking): ReactNode => b.source === 'course-class' ? (
    <Button type={b.status === 'report-due' ? 'primary' : 'default'} size="small" onClick={() => setClassBooking(b)}>
      Classes &amp; attendance
    </Button>
  ) : (
    <>
      {b.source === 'full-support' && b.status === 'completed' && (
        <Button size="small" onClick={() => setRecordBooking(b)}>
          Edit lesson record
        </Button>
      )}
      {b.status === 'report-due' && (
        <Button type="primary" size="small" onClick={() => openFinish(b)}>
          {b.source === 'platform' ? 'Write report' : 'Record lesson'}
        </Button>
      )}
      {b.status === 'completed' && b.source === 'platform' && b.report ? (
        <Button size="small" onClick={() => setReportBooking(b)}>
          View report
        </Button>
      ) : null}
    </>
  );

  const classLesson = classBooking?.courseClass
    ? { id: classBooking.courseClass.lessonId, title: classBooking.courseClass.lessonTitle, duration: classBooking.courseClass.lessonDuration }
    : null;

  const modals = (
    <>
      <LiveAttendanceModal
        lesson={classLesson}
        initialSessionId={(classBooking?.raw as { id?: string } | undefined)?.id ?? null}
        open={!!classBooking}
        onClose={() => { setClassBooking(null); options?.onClassesChanged?.(); }}
      />
      <LessonRecordModal
        open={!!recordBooking}
        title="Record Full Support lesson"
        value={recordValue}
        plannedMinutes={recordBooking?.durationMinutes ?? 60}
        allowCancelled
        saving={recordingFs}
        onClose={() => setRecordBooking(null)}
        onSave={saveLesson}
      />
      <SessionReportModal
        booking={reportBooking}
        open={!!reportBooking}
        onClose={() => setReportBooking(null)}
      />
    </>
  );

  return { openFinish, renderActions, modals };
}
