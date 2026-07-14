import React from 'react';
import { Spin, Empty, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import UnifiedIcon from 'src/components/common/icons/UnifiedIcon';
import { useGetStudentJourneyTasksQuery } from 'src/app/services/student-hub/studentJourneyReadonlyApi';
import './tasks-readonly.scss';

interface StudentHubTasksProps {
  studentId: string;
  studentName?: string;
}

type TaskStatus = 'done' | 'awaiting-review' | 'open';

function taskStatus(t: { hasFeedback: boolean; submissionText?: string; submissionFileUrls?: { fileName: string; url: string }[] }): TaskStatus {
  if (t.hasFeedback) return 'done';
  if (t.submissionText || (t.submissionFileUrls && t.submissionFileUrls.length > 0)) {
    return 'awaiting-review';
  }
  return 'open';
}

function formatDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const StudentHubTasks: React.FC<StudentHubTasksProps> = ({ studentId }) => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetStudentJourneyTasksQuery(studentId, {
    skip: !studentId,
  });

  const tasks = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="counselor-tasks-view counselor-tasks-view--center">
        <Spin size="large" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="counselor-tasks-view counselor-tasks-view--center">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('Unable to load tasks right now.')}
        />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="counselor-tasks-view counselor-tasks-view--center">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('No mentor tasks assigned yet.')}
        />
      </div>
    );
  }

  return (
    <div className="counselor-tasks-view">
      <div className="counselor-tasks-list">
        {tasks.map((task) => {
          const status = taskStatus(task);
          const overdue = status !== 'done' && task.deadline && new Date(task.deadline).getTime() < Date.now();

          return (
            <div key={task.id} className="counselor-task-card">
              <div className="counselor-task-card__icon">
                <UnifiedIcon
                  name={status === 'done' ? 'check-circle' : 'tasks'}
                  size="md"
                  color={status === 'done' ? 'success' : 'primary'}
                />
              </div>

              <div className="counselor-task-card__body">
                <div className="counselor-task-card__header">
                  <span className="counselor-task-card__title">{task.task}</span>
                  {status === 'done' && <Tag color="success">{t('Reviewed')}</Tag>}
                  {status === 'awaiting-review' && <Tag color="gold">{t('Awaiting mentor review')}</Tag>}
                  {status === 'open' && <Tag color="default">{t('Assigned')}</Tag>}
                </div>

                {task.deadline && (
                  <div className={`counselor-task-card__deadline${overdue ? ' counselor-task-card__deadline--overdue' : ''}`}>
                    <UnifiedIcon name="clock" size="xs" color={overdue ? 'error' : 'gray'} />
                    <span>{t('Due')} {formatDate(task.deadline)}</span>
                  </div>
                )}

                {task.submissionText && (
                  <div className="counselor-task-card__detail">
                    <span className="counselor-task-card__detail-label">{t('Student submission')}:</span>
                    <span className="counselor-task-card__detail-text">{task.submissionText}</span>
                  </div>
                )}

                {task.feedback && (
                  <div className="counselor-task-card__detail">
                    <span className="counselor-task-card__detail-label">{t('Mentor feedback')}:</span>
                    <span className="counselor-task-card__detail-text">{task.feedback}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentHubTasks;
