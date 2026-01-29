import React from 'react';
import { Timeline, Typography, Empty } from 'antd';
import UnifiedIcon from '../../../../components/common/icons/UnifiedIcon';
import type { ApplicationActivityEvent } from '../../../../app/services/student-hub/types';
import UniversityNameDisplay from './UniversityNameDisplay';

const { Text } = Typography;

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function eventLabel(ev: ApplicationActivityEvent): string {
  switch (ev.type) {
    case 'checklist_item_completed':
      return ev.payload?.itemName
        ? `Completed: ${String(ev.payload.itemName)}`
        : 'Checklist item completed';
    case 'status_changed':
      return ev.payload?.to
        ? `Status → ${String(ev.payload.to).replace(/_/g, ' ')}`
        : 'Status updated';
    case 'mentor_assigned':
      return ev.payload?.mentorName
        ? `Mentor assigned: ${String(ev.payload.mentorName)}`
        : 'Mentor assigned';
    default:
      return ev.type.replace(/_/g, ' ');
  }
}

function eventIcon(ev: ApplicationActivityEvent): React.ReactNode {
  switch (ev.type) {
    case 'checklist_item_completed':
      return <UnifiedIcon name="check-circle" size="sm" color="success" />;
    case 'status_changed':
      return <UnifiedIcon name="edit" size="sm" color="primary" />;
    case 'mentor_assigned':
      return <UnifiedIcon name="users" size="sm" color="primary" />;
    default:
      return <UnifiedIcon name="info-circle" size="sm" color="default" />;
  }
}

export interface TimelineEvent {
  id: string;
  at: string;
  type: 'created' | 'activity';
  applicationId?: string;
  universityId?: string;
  universityName?: string;
  label: string;
  event?: ApplicationActivityEvent;
}

export interface GlobalActivityTimelineProps {
  applications: Array<{
    id: string;
    universityId?: string;
    universityName?: string;
    createdAt: string;
    activity?: ApplicationActivityEvent[];
  }>;
  scholarships?: Array<{
    id: string;
    scholarshipName?: string;
    createdAt: string;
  }>;
  emptyMessage?: string;
  onApplicationClick?: (id: string) => void;
}

const GlobalActivityTimeline: React.FC<GlobalActivityTimelineProps> = ({
  applications = [],
  scholarships = [],
  emptyMessage = 'No activity yet. Add applications and complete checklist items to see your timeline.',
  onApplicationClick,
}) => {
  const events: TimelineEvent[] = [];

  applications.forEach((app) => {
    events.push({
      id: `created-${app.id}`,
      at: app.createdAt,
      type: 'created',
      applicationId: app.id,
      universityId: app.universityId,
      universityName: app.universityName,
      label: 'Added',
    });
    (app.activity || []).forEach((ev, i) => {
      events.push({
        id: `activity-${app.id}-${i}`,
        at: ev.at,
        type: 'activity',
        applicationId: app.id,
        universityId: app.universityId,
        universityName: app.universityName,
        label: eventLabel(ev),
        event: ev,
      });
    });
  });

  scholarships.forEach((sch) => {
    events.push({
      id: `sch-created-${sch.id}`,
      at: sch.createdAt,
      type: 'created',
      label: `Added scholarship: ${sch.scholarshipName || 'Scholarship'}`,
    });
  });

  const sorted = events
    .slice()
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const timelineItems = sorted.map((e) => {
    const isCreated = e.type === 'created';
    const university = (e.universityId || e.universityName) ? (
      <UniversityNameDisplay universityId={e.universityId} universityName={e.universityName} />
    ) : null;
    return {
      color: isCreated ? ('green' as const) : ('blue' as const),
      dot: isCreated ? (
        <UnifiedIcon name="plus-circle" size="sm" color="success" />
      ) : (
        e.event ? eventIcon(e.event) : <UnifiedIcon name="info-circle" size="sm" color="default" />
      ),
      children: (
        <div
          style={{ cursor: e.applicationId && onApplicationClick ? 'pointer' : 'default' }}
          onClick={() => e.applicationId && onApplicationClick?.(e.applicationId)}
          onKeyDown={(ev) => {
            if (e.applicationId && onApplicationClick && (ev.key === 'Enter' || ev.key === ' ')) {
              ev.preventDefault();
              onApplicationClick(e.applicationId!);
            }
          }}
          role={e.applicationId && onApplicationClick ? 'button' : undefined}
          tabIndex={e.applicationId && onApplicationClick ? 0 : undefined}
        >
          {isCreated && university ? (
            <>
              <Text strong>Added </Text>
              <Text strong>{university}</Text>
            </>
          ) : (
            <>
              {university && (
                <>
                  <Text strong>{university}</Text>
                  <Text> — </Text>
                </>
              )}
              <Text>{e.label}</Text>
            </>
          )}
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatDate(e.at)}
          </Text>
        </div>
      ),
    };
  });

  if (timelineItems.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={emptyMessage}
          style={{ marginBottom: 0 }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 0' }}>
      <Timeline items={timelineItems} />
    </div>
  );
};

export default GlobalActivityTimeline;
