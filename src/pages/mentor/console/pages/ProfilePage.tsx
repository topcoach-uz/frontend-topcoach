import { useState } from 'react';
import { Avatar, Button, Card, Col, Descriptions, Row, Space, Typography } from 'antd';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MEDIA_TAGS } from 'src/app/api/Api';
import { useTypedSelector } from 'src/app/store';
import { useGetMeQuery } from 'src/app/services/users';
import EditProfileModal from 'src/components/layouts/components/header/_components/actions/_components/EditProfileModal';
import { McPill } from '../components/McPill';

const { Text, Paragraph } = Typography;

type MentorProfileShape = {
  title?: string | null;
  summary?: string | null;
  university?: { name?: string } | string | null;
  major?: string | null;
  level?: string | null;
  status?: string | null;
  visibleOnMentorsPage?: boolean | null;
  tags?: string[] | null;
} | null | undefined;

export default function MentorConsoleProfilePage() {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const { data: me } = useGetMeQuery();
  const profileFromStore = useTypedSelector((s) => s.auth.profile);
  const user = me ?? profileFromStore;

  const profile = user?.profile;
  const mentorProfile = (user as { mentorProfile?: MentorProfileShape } | undefined)
    ?.mentorProfile;

  const displayName = profile?.name || user?.email || '—';

  const avatarUrl = (() => {
    const media = profile?.media as Array<{ tags?: string[] | null; url?: string }> | undefined;
    if (!media || media.length === 0) return null;
    const picks = media
      .filter((m) => m.tags?.includes(MEDIA_TAGS.ProfilePicture) || m.tags === null)
      .sort((a, b) => {
        const ta = (a as { createdAt?: string }).createdAt ?? '';
        const tb = (b as { createdAt?: string }).createdAt ?? '';
        return tb.localeCompare(ta);
      });
    return picks[0]?.url ?? null;
  })();

  const universityName =
    typeof mentorProfile?.university === 'string'
      ? mentorProfile.university
      : mentorProfile?.university?.name ?? null;

  const mentorStatus = (mentorProfile?.status ?? '').toLowerCase();
  const statusVariant: 'success' | 'warning' | 'danger' | 'neutral' =
    mentorStatus === 'accepted'
      ? 'success'
      : mentorStatus === 'rejected'
        ? 'danger'
        : mentorStatus
          ? 'warning'
          : 'neutral';

  const visibility = mentorProfile?.visibleOnMentorsPage
    ? { label: 'Visible on Mentors page', variant: 'success' as const }
    : { label: 'Hidden from Mentors page', variant: 'neutral' as const };

  return (
    <div>
      <div className="mc-page-head mc-page-head--ruled">
        <div className="mc-page-eyebrow">
          Mentor <span className="mc-page-eyebrow-accent">· Account</span>
        </div>
        <h1 className="mc-page-title">Profile</h1>
        <p className="mc-page-lead">
          Your public mentor profile. This is what students see when browsing mentors.
        </p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card bordered={false} className="mc-panel">
            <div style={{ textAlign: 'center', padding: '8px 4px 0' }}>
              <Avatar
                size={112}
                src={avatarUrl ?? undefined}
                style={{
                  background: 'var(--mc-accent-soft)',
                  color: 'var(--mc-accent)',
                  fontSize: 34,
                  fontWeight: 700,
                }}
              >
                {displayName.slice(0, 1).toUpperCase()}
              </Avatar>
              <div
                style={{
                  marginTop: 14,
                  fontWeight: 700,
                  fontSize: 18,
                  color: 'var(--mc-text)',
                }}
              >
                {displayName}
              </div>
              <Text style={{ color: 'var(--mc-text-muted)', fontSize: 13 }}>
                {mentorProfile?.title || 'Mentor'}
              </Text>
              <div style={{ marginTop: 14 }}>
                <Space wrap size={6}>
                  {mentorProfile?.level && (
                    <McPill variant="info">{mentorProfile.level} tier</McPill>
                  )}
                  {mentorProfile?.status && (
                    <McPill variant={statusVariant}>{mentorProfile.status}</McPill>
                  )}
                  <McPill variant={visibility.variant}>{visibility.label}</McPill>
                </Space>
              </div>
              <Button
                type="primary"
                block
                style={{ marginTop: 18 }}
                onClick={() => setEditOpen(true)}
              >
                Edit profile
              </Button>
              {user?.id && (
                <Link
                  to={`/mentors/${user.id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 10,
                    color: 'var(--mc-accent)',
                    fontSize: 13,
                  }}
                >
                  <ExternalLink size={14} /> View public page
                </Link>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card bordered={false} className="mc-panel" title="About">
            <Descriptions
              column={1}
              colon={false}
              size="small"
              labelStyle={{ color: 'var(--mc-text-muted)', width: 160 }}
              contentStyle={{ color: 'var(--mc-text)' }}
            >
              <Descriptions.Item label="Email">{user?.email ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Title">
                {mentorProfile?.title || <Text type="secondary">Not set</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="University">
                {universityName || <Text type="secondary">Not set</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Major">
                {mentorProfile?.major || <Text type="secondary">Not set</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Tags">
                {mentorProfile?.tags && mentorProfile.tags.length > 0 ? (
                  <Space wrap size={6}>
                    {mentorProfile.tags.map((t) => (
                      <McPill key={t} variant="neutral">
                        {t}
                      </McPill>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">No tags</Text>
                )}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 18 }}>
              <Text style={{ color: 'var(--mc-text-muted)', fontSize: 12 }}>Summary</Text>
              <Paragraph style={{ marginTop: 6, marginBottom: 0 }}>
                {mentorProfile?.summary || (
                  <Text type="secondary">
                    No summary yet — add one so students know what to expect.
                  </Text>
                )}
              </Paragraph>
            </div>
          </Card>

          <Card
            bordered={false}
            className="mc-panel"
            style={{ marginTop: 16 }}
            title="Next steps"
          >
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'var(--mc-bg-subtle)',
                  borderRadius: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--mc-text)' }}>
                    Update your availability
                  </div>
                  <Text style={{ fontSize: 12, color: 'var(--mc-text-muted)' }}>
                    Open slots let students book sessions with you.
                  </Text>
                </div>
                <Button type="text" onClick={() => navigate('/mentor/availability')}>
                  Open <ArrowUpRight size={14} />
                </Button>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'var(--mc-bg-subtle)',
                  borderRadius: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--mc-text)' }}>Review students</div>
                  <Text style={{ fontSize: 12, color: 'var(--mc-text-muted)' }}>
                    See sessions, tasks, and milestones at a glance.
                  </Text>
                </div>
                <Button type="text" onClick={() => navigate('/mentor/students')}>
                  Open <ArrowUpRight size={14} />
                </Button>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <EditProfileModal isModalVisible={editOpen} setIsModalVisible={setEditOpen} />
    </div>
  );
}
