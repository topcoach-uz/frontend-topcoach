import { useEffect, useState } from 'react';
import { Alert, Button, Card, Empty, Spin } from 'antd';
import { ACCESS_TOKEN } from 'src/constants/storage';
import LiveAttendanceModal from 'src/pages/admin/courses/modules/LiveAttendanceModal';

type LiveLesson = { id: string; title: string; duration: number; moduleTitle: string; courseName: string };

export default function CourseClassesPage() {
  const [lessons, setLessons] = useState<LiveLesson[]>([]);
  const [selected, setSelected] = useState<LiveLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/courses/live/my-lessons', { headers: { Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN) || ''}` }, signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error('Could not load your live course lessons'); return response.json() as Promise<LiveLesson[]>; })
      .then(setLessons)
      .catch((cause) => { if (cause.name !== 'AbortError') setError(cause.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return <section style={{ padding: 24 }}>
    <h1>Course classes</h1>
    <p>Schedule your live lessons and record each student's attendance and lesson work.</p>
    {loading ? <Spin /> : error ? <Alert type="error" message={error} /> : lessons.length === 0 ? <Empty description="No live course lessons are assigned to you yet" /> :
      <div style={{ display: 'grid', gap: 12 }}>
        {lessons.map((lesson) => <Card key={lesson.id} size="small" title={lesson.title} extra={<Button onClick={() => setSelected(lesson)}>Classes & attendance</Button>}>
          {lesson.moduleTitle} · {lesson.courseName} · {lesson.duration} min
        </Card>)}
      </div>}
    <LiveAttendanceModal allowReschedule lesson={selected} open={!!selected} onClose={() => setSelected(null)} />
  </section>;
}
