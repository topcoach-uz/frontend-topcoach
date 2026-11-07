import { useState } from 'react';
import { Alert, Button, Card, Empty, Skeleton } from 'antd';
import {
  useGetLiveClassSessionsQuery,
  useGetMyLiveLessonsQuery,
  type LiveLessonDto,
} from 'src/app/services/courses';
import LiveAttendanceModal from 'src/pages/admin/courses/modules/LiveAttendanceModal';

/** Live course lessons assigned to the mentor; classes are scheduled per lesson. */
export default function CourseClassesPage() {
  const { data: lessons = [], isLoading, isError, refetch } = useGetMyLiveLessonsQuery();
  const [selected, setSelected] = useState<LiveLessonDto | null>(null);
  const lessonIds = lessons.map((lesson) => lesson.id).sort();
  // Same cache entry the Schedule page uses; refetched after the modal closes.
  const { refetch: refetchClasses } = useGetLiveClassSessionsQuery(lessonIds, {
    skip: lessonIds.length === 0,
  });

  const closeModal = () => {
    setSelected(null);
    if (lessonIds.length > 0) void refetchClasses();
  };

  return (
    <div>
      <div className="mc-page-head mc-page-head--ruled">
        <div className="mc-page-eyebrow">
          Mentor <span className="mc-page-eyebrow-accent">· Courses</span>
        </div>
        <h1 className="mc-page-title">Course classes</h1>
        <p className="mc-page-lead">
          Schedule your live lessons and record each student&apos;s attendance and lesson work.
        </p>
      </div>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : isError ? (
        <Alert
          type="error"
          showIcon
          message="Could not load your live course lessons"
          action={<Button size="small" onClick={() => void refetch()}>Retry</Button>}
        />
      ) : lessons.length === 0 ? (
        <Empty description="No live course lessons are assigned to you yet" />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {lessons.map((lesson) => (
            <Card
              key={lesson.id}
              size="small"
              className="mc-panel"
              title={lesson.title}
              extra={<Button onClick={() => setSelected(lesson)}>Classes &amp; attendance</Button>}
            >
              {lesson.moduleTitle} · {lesson.courseName} · {lesson.duration} min
            </Card>
          ))}
        </div>
      )}
      <LiveAttendanceModal lesson={selected} open={!!selected} onClose={closeModal} />
    </div>
  );
}
