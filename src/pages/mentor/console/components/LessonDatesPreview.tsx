import { Alert, Checkbox } from 'antd';
import type { LessonPlanPreview } from 'src/app/services/fullSupportLessonPlansApi';

export function lessonTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
export default function LessonDatesPreview({
  preview,
  onExclude,
  disabled,
  cancelling = false,
}: {
  preview: LessonPlanPreview;
  onExclude?: (date: string, excluded: boolean) => void;
  disabled?: boolean;
  cancelling?: boolean;
}) {
  const selected = preview.sessions.filter((row) => !row.excluded);
  const minutes = selected.reduce(
    (sum, row) =>
      sum + (Date.parse(row.endTime) - Date.parse(row.dateTime)) / 60000,
    0,
  );
  return (
    <section aria-label="Lesson date preview" style={{ marginTop: 20 }}>
      <strong>
        {selected.length} lesson{selected.length === 1 ? '' : 's'} ·{' '}
        {Number((minutes / 60).toFixed(2))} hour{minutes === 60 ? '' : 's'}{' '}
        {cancelling ? 'to cancel' : 'scheduled'}
      </strong>
      <p style={{ margin: '4px 0 12px', color: '#736b60' }}>
        {preview.timezone} ·{' '}
        {cancelling
          ? 'Completed lessons keep their attendance and notes.'
          : 'Hours count as completed only after attendance is recorded.'}
      </p>
      {preview.conflicts.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message="Some dates conflict with existing TopCoach lessons, bookings or classes. Change the time or skip those dates."
          style={{ marginBottom: 12 }}
        />
      )}
      <div
        style={{
          maxHeight: 280,
          overflowY: 'auto',
          border: '1px solid #e7e1d6',
          borderRadius: 10,
        }}
      >
        {preview.sessions.map((row, i) => {
          const conflicts = preview.conflicts.filter(
            (c) => c.dateTime === row.dateTime,
          );
          return (
            <div
              key={row.id ?? row.dateTime}
              style={{
                padding: '11px 14px',
                borderTop: i ? '1px solid #eee8df' : undefined,
                background: conflicts.length ? '#fff7e6' : undefined,
                opacity: row.excluded ? 0.6 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {onExclude && (
                  <Checkbox
                    aria-label={`Include ${row.localDate}`}
                    checked={!row.excluded}
                    disabled={disabled}
                    onChange={(e) =>
                      onExclude(row.localDate!, !e.target.checked)
                    }
                  />
                )}
                <div>
                  {row.previousDateTime &&
                    row.previousDateTime !== row.dateTime && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#736b60',
                          textDecoration: 'line-through',
                        }}
                      >
                        {lessonTime(row.previousDateTime, preview.timezone)}
                      </div>
                    )}
                  <strong>{lessonTime(row.dateTime, preview.timezone)}</strong>
                  <span style={{ marginLeft: 8 }}>
                    {Math.round(
                      (Date.parse(row.endTime) - Date.parse(row.dateTime)) /
                        60000,
                    )}{' '}
                    min{row.excluded ? ' · Skipped' : ''}
                  </span>
                </div>
              </div>
              {conflicts.map((c, n) => (
                <div
                  key={n}
                  style={{ color: '#9a5315', fontSize: 12, marginTop: 5 }}
                >
                  {c.kind}: {lessonTime(c.startsAt, preview.timezone)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
