import { useCallback, useEffect, useState } from 'react';
import { ACCESS_TOKEN } from 'src/constants/storage';
import { loadCourseSchedule, type CourseBooking } from './courseSessions';

export function useMentorCourseSchedule() {
  const [bookings, setBookings] = useState<CourseBooking[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const refetch = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let pending = false;
    const refresh = async () => {
      if (pending) return;
      pending = true;
      try {
        const result = await loadCourseSchedule(async <T,>(path: string): Promise<T> => {
          const response = await fetch(`/api/courses/live/${path}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN) || ''}` }, signal: controller.signal,
          });
          if (!response.ok) throw new Error('Could not load course classes');
          return response.json();
        });
        if (active) {
          setBookings(result.bookings);
          setError(result.failedLessons ? 'Some course classes could not be loaded. Other sessions are still shown.' : '');
        }
      } catch {
        if (active) setError('Course classes could not be refreshed. The course schedule may be incomplete.');
      } finally { pending = false; if (active) setLoading(false); }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => { active = false; controller.abort(); window.clearInterval(timer); };
  }, [revision]);
  return { bookings, isLoading, error, refetch };
}
