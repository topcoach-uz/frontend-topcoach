import React, { useState } from 'react';
import { Select, Avatar, Button, Space, Typography, Popover, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetMentorsQuery } from '../../../../app/services/mentors';
import { useUpdateCollegeApplicationMutation } from '../../../../app/services/student-hub/applicationTrackingApi';
import type { MentorsResponseDto } from '../../../../app/api/Api';
import { getLatestCreatedImg } from '../../../../utils';

const { Text } = Typography;
const { Option } = Select;

interface MentorAssignmentProps {
  applicationId: string;
  mentorId?: string;
  onUpdate?: (mentorId: string | null) => void;
}

const MentorAssignment: React.FC<MentorAssignmentProps> = ({
  applicationId,
  mentorId,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [updateApplication] = useUpdateCollegeApplicationMutation();
  const { data: mentors, isLoading: mentorsLoading } = useGetMentorsQuery();
  const [visible, setVisible] = useState(false);

  const assignedMentor = mentors?.find(m => m.id === mentorId);
  const assignedMentorAvatar = assignedMentor?.profile?.media
    ? getLatestCreatedImg(assignedMentor.profile.media as any)
    : (assignedMentor?.profile as { avatar?: string } | undefined)?.avatar;

  const handleAssignMentor = async (newMentorId: string | null | undefined) => {
    try {
      const isUnassign = newMentorId == null || newMentorId === '';
      await updateApplication({
        id: applicationId,
        data: isUnassign ? ({ mentorId: null } as any) : { mentorId: newMentorId as string },
      }).unwrap();
      if (onUpdate) onUpdate(isUnassign ? null : (newMentorId as string));
      message.success(isUnassign ? 'Mentor removed' : 'Mentor assigned');
      setVisible(false);
    } catch (error: any) {
      message.error(error?.data?.message || 'Failed to update mentor');
    }
  };

  const handleUnassign = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await handleAssignMentor(null);
  };

  const handleRequestReview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mentorId) navigate(`/mentors/${mentorId}`);
  };

  const mentorOptions = mentors?.map((mentor: MentorsResponseDto) => {
    const profileImage = mentor.profile?.media ? getLatestCreatedImg(mentor.profile.media as any) : null;
    const avatarUrl = profileImage || (mentor.profile as { avatar?: string } | undefined)?.avatar;
    const subtitle = mentor.mentorProfile?.title || mentor.mentorProfile?.university || '';
    return {
      value: mentor.id,
      label: mentor.profile?.name || 'Unknown Mentor',
      avatar: avatarUrl || undefined,
      subtitle,
    };
  }) || [];

  const popoverContent = (
    <div className="mentor-assignment-popover">
      <div className="mentor-assignment-popover-title">{t('studentHub.applications.assignMentor')}</div>
      <Select
        className="mentor-assignment-select"
        placeholder={t('studentHub.applications.searchAndSelectMentor')}
        showSearch
        value={mentorId || undefined}
        onChange={(v) => handleAssignMentor(v)}
        loading={mentorsLoading}
        filterOption={(input, option) =>
          String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        allowClear
        style={{ width: '100%', marginBottom: 12 }}
      >
        {mentorOptions.map((m) => (
          <Option key={m.value} value={m.value} label={m.label}>
            <div className="mentor-option">
              <Avatar size="small" src={m.avatar} style={{ flexShrink: 0 }} />
              <div className="mentor-option-text">
                <div className="mentor-option-name">{m.label}</div>
                {m.subtitle && <div className="mentor-option-subtitle">{m.subtitle}</div>}
              </div>
            </div>
          </Option>
        ))}
      </Select>
      {assignedMentor && (
        <div className="mentor-assignment-actions">
          <Button type="primary" block onClick={handleRequestReview} size="small" style={{ marginBottom: 8 }}>
            {t('studentHub.applications.requestReview')}
          </Button>
          <Button type="link" size="small" block onClick={handleUnassign} style={{ padding: 0, color: '#64748b' }}>
            {t('studentHub.applications.unassign')}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="mentor-assignment" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <Popover
        content={popoverContent}
        title={null}
        trigger="click"
        open={visible}
        onOpenChange={setVisible}
        placement="bottomLeft"
        getPopupContainer={(el) => el.parentElement || document.body}
      >
        <div
          className={`mentor-assignment-trigger ${assignedMentor ? 'mentor-assignment-trigger--assigned' : ''}`}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); setVisible(!visible); }}
        >
          {assignedMentor ? (
            <>
              <Space size={8} style={{ flex: 1, minWidth: 0 }}>
                <Avatar size="small" src={assignedMentorAvatar} style={{ flexShrink: 0 }} />
                <div className="mentor-trigger-info">
                  <span className="mentor-trigger-name">{assignedMentor.profile?.name || t('studentHub.applications.mentor')}</span>
                  {(assignedMentor.mentorProfile?.title || assignedMentor.mentorProfile?.university) && (
                    <span className="mentor-trigger-subtitle">
                      {assignedMentor.mentorProfile?.title || assignedMentor.mentorProfile?.university}
                    </span>
                  )}
                </div>
              </Space>
              <button
                type="button"
                className="mentor-assignment-unassign-x"
                onClick={handleUnassign}
                aria-label={t('studentHub.applications.unassignMentorAria')}
              >
                <CloseOutlined />
              </button>
            </>
          ) : (
            <Text type="secondary" style={{ fontSize: 13 }}>{t('studentHub.applications.assignMentor')}</Text>
          )}
        </div>
      </Popover>
    </div>
  );
};

export default MentorAssignment;
