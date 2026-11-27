import { SessionRecording } from 'src/components/session-recording/SessionRecording';
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { ACCESS_TOKEN } from 'src/constants/storage';

type LiveClass = { id: string; startsAt: string; durationMinutes: number; meetingUrl: string | null; status: 'scheduled' | 'held' | 'cancelled'; summary: string; attendance: 'present' | 'late' | 'absent' | 'excused' | null };

export default function LiveClassSchedule({ lessonId }: { lessonId: string }) {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setClasses([]);
    setError('');
    fetch(`/api/courses/live/lessons/${lessonId}/my-sessions`, { headers: { Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN) || ''}` }, signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load class schedule');
        return response.json() as Promise<LiveClass[]>;
      })
      .then(setClasses)
      .catch((cause) => { if (cause.name !== 'AbortError') setError(cause.message); });
    return () => controller.abort();
  }, [lessonId]);
  if (error) return <p role="alert">{error}</p>;
  if (!classes.length) return <p>Your class schedule will appear here when a mentor or admin sets a date.</p>;
  return <div style={{ display: 'grid', gap: 12 }}>
    {classes.map((liveClass) => <div key={liveClass.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
      <strong>{dayjs(liveClass.startsAt).format('DD MMM YYYY, HH:mm')}</strong> · {liveClass.durationMinutes} min · {liveClass.status}
      {liveClass.status !== 'cancelled' && liveClass.meetingUrl && <div><a href={liveClass.meetingUrl} target="_blank" rel="noreferrer">Open meeting room ↗</a></div>}
      {liveClass.status === 'held' && <div>Attendance: {liveClass.attendance ?? 'Not recorded yet'}</div>}
      <SessionRecording source="course-class" sessionId={liveClass.id} />
      {liveClass.summary && <p style={{ margin: '8px 0 0' }}>{liveClass.summary}</p>}
    </div>)}
  </div>;
}
