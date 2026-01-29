import React from 'react';
import { Timeline, Typography } from 'antd';
import UnifiedIcon from '../../../../components/common/icons/UnifiedIcon';
import type { ApplicationActivityEvent } from '../../../../app/services/student-hub/types';

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
        ? `Status changed to ${String(ev.payload.to)}`
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

export interface ApplicationTimelineProps {
  createdAt: string;
  activity?: ApplicationActivityEvent[];
  emptyMessage?: string;
}

const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({
  createdAt,
  activity = [],
  emptyMessage = 'No activity yet.',
}) => {
  const createdItem = {
    color: 'green',
    dot: <UnifiedIcon name="plus-circle" size="sm" color="success" />,
    children: (
      <>
        <Text strong>Application created</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatDate(createdAt)}
        </Text>
      </>
    ),
  };

  const activityItems = activity
    .slice()
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .map((ev) => ({
      color: 'blue' as const,
      dot: eventIcon(ev),
      children: (
        <>
          <Text>{eventLabel(ev)}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatDate(ev.at)}
          </Text>
        </>
      ),
    }));

  const items = [createdItem, ...activityItems];

  if (items.length === 1 && activity.length === 0) {
    return (
      <div style={{ padding: '12px 0' }}>
        <Timeline items={[createdItem]} />
        <Text type="secondary" style={{ fontSize: 13, marginTop: 8, display: 'block' }}>
          {emptyMessage}
        </Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 0' }}>
      <Timeline items={items} />
    </div>
  );
};

export default ApplicationTimeline;
