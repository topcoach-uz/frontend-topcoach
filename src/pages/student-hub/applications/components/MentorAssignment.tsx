import React, { useState } from 'react';
import { Select, Avatar, Button, Space, Typography, Popover, message } from 'antd';
import UnifiedIcon from '../../../../components/common/icons/UnifiedIcon';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
  const [updateApplication, { isLoading }] = useUpdateCollegeApplicationMutation();
  const { data: mentors, isLoading: mentorsLoading } = useGetMentorsQuery();
  const [visible, setVisible] = useState(false);

  const assignedMentor = mentors?.find(m => m.id === mentorId);
  
  // Get assigned mentor avatar from media array
  const assignedMentorAvatar = assignedMentor?.profile?.media 
    ? getLatestCreatedImg(assignedMentor.profile.media as any)
    : assignedMentor?.profile?.avatar;

  const handleAssignMentor = async (newMentorId: string | null) => {
    try {
      await updateApplication({
        id: applicationId,
        data: { mentorId: newMentorId || undefined },
      }).unwrap();

      if (onUpdate) {
        onUpdate(newMentorId);
      }

      message.success(newMentorId ? 'Mentor assigned successfully' : 'Mentor removed successfully');
      setVisible(false);
    } catch (error: any) {
      message.error(error?.data?.message || 'Failed to update mentor assignment');
    }
  };

  const handleRequestReview = () => {
    if (mentorId) {
      // Navigate to mentor booking/chat
      navigate(`/mentors/${mentorId}`);
    }
  };

  const mentorOptions = mentors?.map((mentor: MentorsResponseDto) => {
    // Get avatar from media array first (like mentors page), then fallback to profile.avatar
    const profileImage = mentor.profile?.media 
      ? getLatestCreatedImg(mentor.profile.media as any)
      : null;
    const avatarUrl = profileImage || mentor.profile?.avatar;
    
    return {
      value: mentor.id,
      label: mentor.profile?.name || 'Unknown Mentor',
      avatar: avatarUrl || undefined,
      university: mentor.mentorProfile?.university,
      experience: mentor.mentorProfile?.experienceLevel,
      profile: mentor.profile, // Pass full profile for media access
    };
  }) || [];

  const content = (
    <div style={{ width: 300 }}>
      <div style={{ marginBottom: 12 }}>
        <Text strong>Assign Mentor</Text>
      </div>
      <Select
        style={{ width: '100%', marginBottom: 12 }}
        placeholder="Search and select a mentor"
        showSearch
        value={mentorId || undefined}
        onChange={handleAssignMentor}
        loading={mentorsLoading}
        filterOption={(input, option) => {
          const label = option?.label?.toLowerCase() || '';
          return label.includes(input.toLowerCase());
        }}
        allowClear
      >
        {mentorOptions.map((mentor) => (
          <Option key={mentor.value} value={mentor.value}>
            <Space>
              <Avatar 
                size="small" 
                src={mentor.avatar || undefined}
                icon={!mentor.avatar && <UnifiedIcon name="user" size="sm" color="primary" />}
                style={{ 
                  backgroundColor: mentor.avatar ? 'transparent' : '#f0f0f0',
                  border: '1px solid #e5e7eb',
                  flexShrink: 0
                }}
              />
              <div>
                <div>{mentor.label}</div>
                {mentor.university && (
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {mentor.university}
                  </Text>
                )}
              </div>
            </Space>
          </Option>
        ))}
      </Select>
      {assignedMentor && (
        <Button
          type="primary"
          block
          icon={<UnifiedIcon name="message-circle" size="sm" color="white" />}
          onClick={handleRequestReview}
        >
          Request Review
        </Button>
      )}
    </div>
  );

  return (
    <div 
      className="mentor-assignment"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Popover
        content={content}
        title={null}
        trigger="click"
        open={visible}
        onOpenChange={setVisible}
        placement="bottomLeft"
        getPopupContainer={(trigger) => trigger.parentElement || document.body}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 16px',
            background: assignedMentor ? '#f0fdf4' : '#ffffff',
            borderRadius: 12,
            cursor: 'pointer',
            border: assignedMentor ? '2px solid #22c55e' : '2px solid #e5e7eb',
            transition: 'all 0.2s ease',
            boxShadow: assignedMentor ? '0 2px 8px rgba(34, 197, 94, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
            width: '100%',
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setVisible(!visible);
          }}
          onMouseEnter={(e) => {
            if (!assignedMentor) {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#8b0000';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 0, 0, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (!assignedMentor) {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
            }
          }}
        >
          <Space>
            <UnifiedIcon name="user" size="sm" color="primary" />
            {assignedMentor ? (
              <>
                <Avatar 
                  size="small" 
                  src={assignedMentorAvatar || undefined}
                  icon={!assignedMentorAvatar && <UnifiedIcon name="user" size="sm" color="primary" />}
                  style={{ 
                    backgroundColor: assignedMentorAvatar ? 'transparent' : '#f0f0f0',
                    border: '2px solid #e5e7eb',
                    flexShrink: 0
                  }}
                />
                <Text strong style={{ fontSize: '13px' }}>
                  {assignedMentor.profile?.name || 'Mentor'}
                </Text>
                <UnifiedIcon name="check-circle" size="sm" color="success" />
              </>
            ) : (
              <Text type="secondary" style={{ fontSize: '13px' }}>
                Assign Mentor
              </Text>
            )}
          </Space>
        </div>
      </Popover>
    </div>
  );
};

export default MentorAssignment;
