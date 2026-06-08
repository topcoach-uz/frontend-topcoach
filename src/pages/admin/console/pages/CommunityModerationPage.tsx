/**
 * Community Moderation — admin console view for the Community Feed.
 *
 * Three tabs:
 *   - Reports queue: pending / actioned / dismissed / all
 *   - All posts: every post with status + flag count
 *   - User activity: per-user timeline of posts/comments/likes/reports
 *
 * v1 = mock data wired to the visual designs. Real endpoints land in
 * backend Phase 3 (see docs/COMMUNITY_FEED_PRD.md).
 */
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Dropdown, Input, Modal, Row, Table, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Filter,
  Download,
  Pin,
  Flag as FlagIcon,
  MessageSquare,
  EyeOff,
  Eye,
  X,
  CheckCircle2,
  Ban,
  ArrowRight,
  AlertTriangle,
  Heart,
  Bookmark,
  Trash2,
  ExternalLink,
  MoreHorizontal,
} from 'lucide-react';
import { AcPill, type AcPillVariant } from '../components/AcPill';
import { avatarStyleForId, initialsFromName } from '../utils';
import {
  useAdminListReportsQuery,
  useAdminListPostsQuery,
  useAdminStatsQuery,
  useAdminHidePostMutation,
  useAdminUnhidePostMutation,
  useAdminResolveReportMutation,
  useAdminFlaggedUsersQuery,
  useAdminUserActivityQuery,
  useAdminDeletePostMutation,
  type CommunityReport as ApiReport,
} from 'src/app/services/communityFeedApi';
import { hostName } from 'src/app/services/api/const';
import './CommunityModerationPage.scss';

/** Same helper used in the student-facing feed — resolve relative upload paths. */
const resolveMediaUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${hostName}${url.startsWith('/') ? '' : '/'}${url}`;
};

/* ─── types ─────────────────────────────────────────────────── */

type ReportStatus = 'PENDING' | 'ACTIONED' | 'DISMISSED';

type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'OFF_TOPIC'
  | 'MISINFORMATION'
  | 'SAFETY'
  | 'OTHER';

type Category =
  | 'ADMISSIONS'
  | 'COLLEGE_LIFE'
  | 'STUDY_ABROAD'
  | 'EXAM_PREP'
  | 'WELLNESS'
  | 'RESEARCH'
  | 'GENERAL';

type ContentTarget = 'post' | 'comment';

type Report = {
  id: string;
  status: ReportStatus;
  reason: ReportReason;
  target: ContentTarget;
  flagCount: number;
  createdAt: string; // display string e.g. "18m ago"
  authorName: string;
  authorHandle: string;
  authorCategory: Category;
  body: string;
  reporterName: string;
  reporterNote: string;
};

type PostRow = {
  id: string;
  category: Category;
  date: string;
  createdAtIso: string;
  body: string;
  mediaUrls: string[];
  pinned?: boolean;
  authorName: string;
  authorId: string;
  authorAvatarUrl: string | null;
  likes: number;
  replies: number;
  saves: number;
  views: number;
  flags: number;
  status: 'LIVE' | 'HIDDEN' | 'DELETED';
  hiddenReason?: string | null;
  isAutoFlagged?: boolean;
};


/* ─── mock data ─────────────────────────────────────────────── */

const REASON_COPY: Record<ReportReason, string> = {
  SPAM: 'Spam or advertising',
  HARASSMENT: 'Harassment or bullying',
  OFF_TOPIC: 'Off-topic for this community',
  MISINFORMATION: 'Misleading or false information',
  SAFETY: 'Safety concern',
  OTHER: 'Something else',
};

const CATEGORY_COPY: Record<Category, string> = {
  ADMISSIONS: 'Admissions',
  COLLEGE_LIFE: 'College Life',
  STUDY_ABROAD: 'Study Abroad',
  EXAM_PREP: 'Exam Prep',
  WELLNESS: 'Wellness',
  RESEARCH: 'Research',
  GENERAL: 'General',
};

const CATEGORY_PILL: Record<Category, AcPillVariant> = {
  ADMISSIONS: 'rose',
  COLLEGE_LIFE: 'blue',
  STUDY_ABROAD: 'success',
  EXAM_PREP: 'amber',
  WELLNESS: 'purple',
  RESEARCH: 'cyan',
  GENERAL: 'neutral',
};


/* ─── helpers ───────────────────────────────────────────────── */

const statusVariant: Record<PostRow['status'], AcPillVariant> = {
  LIVE: 'success',
  HIDDEN: 'amber',
  DELETED: 'danger',
};

/* ─── page ──────────────────────────────────────────────────── */

type StatusFilter = 'PENDING' | 'ACTIONED' | 'DISMISSED' | 'ALL';

type ResolveAction = 'HIDE' | 'DISMISS' | null;

/** API report → local UI report shape so the existing JSX keeps working. */
const adaptApiReport = (r: ApiReport): Report => ({
  id: r.id,
  status: r.status,
  reason: r.reason,
  target: r.commentId ? 'comment' : 'post',
  flagCount: 1, // backend doesn't aggregate yet; v1.1
  createdAt: new Date(r.createdAt).toLocaleString(),
  authorName: r.post?.author?.name ?? r.comment?.author?.name ?? 'Unknown',
  authorHandle: r.post?.authorId ? `@${r.post.authorId.slice(0, 6)}` : '',
  authorCategory: (r.post?.category ?? 'GENERAL') as Category,
  body: r.post?.body ?? r.comment?.body ?? '',
  reporterName: r.reporterId === '00000000-0000-0000-0000-000000000001' ? 'System (Gemini)' : 'User',
  reporterNote: r.note ?? '',
});

export default function CommunityModerationPage() {
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilter>('PENDING');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [resolveReport, setResolveReport] = useState<Report | null>(null);
  const [resolveAction, setResolveAction] = useState<ResolveAction>(null);
  const [resolveNote, setResolveNote] = useState('');

  // The full-post detail modal opened from the "All posts" table row.
  const [openPost, setOpenPost] = useState<PostRow | null>(null);

  /* ─── live data ────────────────────────────────────────── */
  const { data: stats } = useAdminStatsQuery();
  const { data: reportsList } = useAdminListReportsQuery({
    status: activeStatusFilter === 'ALL' ? 'ALL' : activeStatusFilter,
  });
  const { data: postsList } = useAdminListPostsQuery();
  const [hidePost] = useAdminHidePostMutation();
  const [unhidePost] = useAdminUnhidePostMutation();
  const [resolveReportMut] = useAdminResolveReportMutation();
  const [adminDeletePost] = useAdminDeletePostMutation();

  const reports: Report[] = useMemo(
    () => (reportsList?.items ?? []).map(adaptApiReport),
    [reportsList],
  );
  const posts: PostRow[] = useMemo(
    () =>
      (postsList?.items ?? []).map((p) => ({
        id: p.id,
        category: p.category as Category,
        date: new Date(p.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        createdAtIso: p.createdAt,
        body: p.body,
        mediaUrls: p.mediaUrls ?? [],
        pinned: p.isPinned,
        authorName: p.author?.name ?? 'Member',
        authorId: p.authorId,
        authorAvatarUrl: p.author?.avatarUrl ?? null,
        likes: p.likeCount,
        replies: p.commentCount,
        saves: p.savedCount,
        views: p.viewCount,
        flags: 0, // backend per-post flag count joins land in v1.1
        status: p.isHidden ? 'HIDDEN' : 'LIVE',
        hiddenReason: p.hiddenReason,
        isAutoFlagged: p.isAutoFlagged,
      })),
    [postsList],
  );

  /* KPI counts */
  const pendingCount = stats ? 0 : reports.filter((r) => r.status === 'PENDING').length;
  const actionedCount = reports.filter((r) => r.status === 'ACTIONED').length;
  const dismissedCount = reports.filter((r) => r.status === 'DISMISSED').length;
  const hiddenCount = posts.filter((p) => p.status === 'HIDDEN').length;

  const visibleReports = useMemo(() => {
    if (activeStatusFilter === 'ALL') return reports;
    return reports.filter((r) => r.status === activeStatusFilter);
  }, [reports, activeStatusFilter]);

  /* Live flagged users + per-user activity timeline. */
  const { data: flaggedUsers = [] } = useAdminFlaggedUsersQuery();
  // Default to the worst offender as soon as the list resolves.
  useEffect(() => {
    if (!selectedUserId && flaggedUsers.length > 0) {
      setSelectedUserId(flaggedUsers[0].id);
    }
  }, [flaggedUsers, selectedUserId]);
  const selectedFlagged = flaggedUsers.find((u) => u.id === selectedUserId) ?? flaggedUsers[0] ?? null;
  const { data: userActivity } = useAdminUserActivityQuery(selectedUserId ?? '', {
    skip: !selectedUserId,
  });

  /* actions */
  const quickHide = (reportId: string) => {
    resolveReportMut({ id: reportId, body: { status: 'ACTIONED' } });
  };
  const quickDismiss = (reportId: string) => {
    resolveReportMut({ id: reportId, body: { status: 'DISMISSED' } });
  };
  const openResolveDialog = (r: Report) => {
    setResolveReport(r);
    setResolveAction(null);
    setResolveNote('');
  };
  const confirmResolve = async () => {
    if (!resolveReport || !resolveAction) return;
    await resolveReportMut({
      id: resolveReport.id,
      body: {
        status: resolveAction === 'HIDE' ? 'ACTIONED' : 'DISMISSED',
        resolutionNote: resolveNote || undefined,
      },
    });
    setResolveReport(null);
    setResolveAction(null);
    setResolveNote('');
  };

  const togglePostHidden = async (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;
    if (target.status === 'HIDDEN') {
      await unhidePost(postId);
    } else {
      await hidePost({ id: postId });
    }
  };

  const handleAdminDelete = async (postId: string) => {
    if (!window.confirm(
      'Soft-delete this post permanently? The author cannot restore it; only an admin running SQL can.',
    )) return;
    await adminDeletePost(postId);
    setOpenPost(null);
  };

  // After mutations, mirror the change into the open detail view so the
  // user doesn't have to close + re-open. We grab the freshest row by id.
  const liveOpenPost = openPost ? posts.find((p) => p.id === openPost.id) ?? openPost : null;

  /* All posts table columns */
  const postColumns: ColumnsType<PostRow> = [
    {
      title: 'Post',
      key: 'post',
      render: (_, row) => (
        <div className="cm-post-cell">
          <div className="cm-post-cell-head">
            {row.pinned && <Pin size={12} className="cm-pin-icon" />}
            <AcPill variant={CATEGORY_PILL[row.category]}>{CATEGORY_COPY[row.category]}</AcPill>
            <span className="cm-post-cell-date">{row.date}</span>
          </div>
          <div
            className={`cm-post-cell-body ${row.status === 'DELETED' ? 'cm-post-cell-body--deleted' : ''}`}
          >
            {row.body}
          </div>
        </div>
      ),
    },
    {
      title: 'Author',
      key: 'author',
      width: 220,
      render: (_, row) => (
        <div className="ac-user-cell">
          <div className="ac-avatar" style={avatarStyleForId(row.authorId)}>
            {initialsFromName(row.authorName)}
          </div>
          <div className="ac-user-cell-text">
            <div className="ac-user-cell-name">{row.authorName}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Likes',
      dataIndex: 'likes',
      width: 80,
      align: 'right' as const,
    },
    {
      title: 'Replies',
      dataIndex: 'replies',
      width: 80,
      align: 'right' as const,
    },
    {
      title: 'Flags',
      dataIndex: 'flags',
      width: 80,
      align: 'right' as const,
      render: (n: number) =>
        n > 0 ? <span className="cm-flag-count">{n}</span> : <span className="cm-dim">—</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (s: PostRow['status']) => <AcPill variant={statusVariant[s]}>{s}</AcPill>,
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, row) =>
        row.status === 'DELETED' ? (
          <Button size="small" type="text" className="cm-row-more">⋯</Button>
        ) : (
          <Button
            size="small"
            icon={row.status === 'HIDDEN' ? null : <EyeOff size={12} />}
            onClick={() => togglePostHidden(row.id)}
          >
            {row.status === 'HIDDEN' ? 'Unhide' : 'Hide'}
          </Button>
        ),
    },
  ];

  return (
    <div className="ac-admin-page cm-page">
      <div className="cm-page-head">
        <div>
          <h1 className="ac-page-title">Keep the feed safe.</h1>
          <p className="ac-page-lead">
            Every post goes live instantly and is moderated after the fact. Review reports, hide violations,
            and track who&rsquo;s posting what.
          </p>
        </div>
        <div className="cm-page-head-actions">
          <Button icon={<Filter size={14} />}>Filters</Button>
          <Button icon={<Download size={14} />}>Export CSV</Button>
        </div>
      </div>

      {/* KPI tiles */}
      <Row gutter={[16, 16]} className="ac-kpi-row ac-kpi-row--equal cm-kpi-row">
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-green">
            <div className="ac-kpi-label">Posts today</div>
            <div className="ac-kpi-value">{stats?.postsToday ?? 0}</div>
            <div className="ac-kpi-meta">
              {stats ? `${stats.postsToday - stats.postsYesterday >= 0 ? '+' : ''}${stats.postsToday - stats.postsYesterday} vs yesterday` : '—'}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-green">
            <div className="ac-kpi-label">Comments today</div>
            <div className="ac-kpi-value">{stats?.commentsToday ?? 0}</div>
            <div className="ac-kpi-meta">
              {stats ? `${stats.commentsToday - stats.commentsYesterday >= 0 ? '+' : ''}${stats.commentsToday - stats.commentsYesterday} vs yesterday` : '—'}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-amber">
            <div className="ac-kpi-label">Pending reports</div>
            <div className="ac-kpi-value">{reportsList?.total ?? pendingCount}</div>
            <div className="ac-kpi-meta">Across the queue</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-blue">
            <div className="ac-kpi-label">Hidden &middot; 7d</div>
            <div className="ac-kpi-value">{stats?.hiddenLast7d ?? hiddenCount}</div>
            <div className="ac-kpi-meta">Moderator actions</div>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        defaultActiveKey="reports"
        className="cm-tabs"
        items={[
          {
            key: 'reports',
            label: (
              <span className="cm-tab-label">
                Reports queue <span className="cm-tab-count">{pendingCount}</span>
              </span>
            ),
            children: (
              <div className="cm-tab-body">
                <div className="cm-sub-pills">
                  {([
                    { key: 'PENDING', label: 'Pending', count: pendingCount },
                    { key: 'ACTIONED', label: 'Actioned', count: actionedCount },
                    { key: 'DISMISSED', label: 'Dismissed', count: dismissedCount },
                    { key: 'ALL', label: 'All', count: reports.length },
                  ] as const).map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      className={`cm-sub-pill ${activeStatusFilter === s.key ? 'cm-sub-pill--on' : ''}`}
                      onClick={() => setActiveStatusFilter(s.key as StatusFilter)}
                    >
                      {s.label} <span className="cm-sub-pill-count">{s.count}</span>
                    </button>
                  ))}
                </div>

                <div className="cm-report-list">
                  {visibleReports.length === 0 ? (
                    <Card bordered={false} className="cm-empty">
                      <CheckCircle2 size={20} className="cm-empty-icon" />
                      <div>
                        <div className="cm-empty-title">Queue is clear.</div>
                        <div className="cm-empty-sub">No {activeStatusFilter.toLowerCase()} reports right now.</div>
                      </div>
                    </Card>
                  ) : (
                    visibleReports.map((r) => (
                      <Card key={r.id} bordered={false} className="cm-report-card">
                        <div className="cm-report-head">
                          <AcPill variant={statusVariant[r.status === 'PENDING' ? 'LIVE' : r.status === 'ACTIONED' ? 'HIDDEN' : 'DELETED']}>
                            {r.status}
                          </AcPill>
                          <span className="cm-report-reason">{REASON_COPY[r.reason]}</span>
                          <span className="cm-report-target">&middot; {r.target}</span>
                          <div className="cm-report-head-right">
                            <span className="cm-report-flagcount">
                              <FlagIcon size={11} /> &times;{r.flagCount}
                            </span>
                            <span className="cm-report-time">{r.createdAt}</span>
                          </div>
                        </div>

                        <div className="cm-report-target-card">
                          <div className="cm-report-author">
                            <div
                              className="ac-avatar ac-avatar--sm"
                              style={avatarStyleForId(r.authorHandle)}
                            >
                              {initialsFromName(r.authorName)}
                            </div>
                            <div className="cm-report-author-text">
                              <span className="cm-report-author-name">{r.authorName}</span>
                              <span className="cm-report-author-handle">{r.authorHandle}</span>
                            </div>
                            <AcPill variant={CATEGORY_PILL[r.authorCategory]}>
                              {CATEGORY_COPY[r.authorCategory]}
                            </AcPill>
                          </div>
                          <div className="cm-report-body">{r.body}</div>
                          <div className="cm-report-quote">
                            <FlagIcon size={11} /> Reporter:{' '}
                            <span className="cm-report-quote-text">&ldquo;{r.reporterNote}&rdquo;</span>
                          </div>
                        </div>

                        {r.status === 'PENDING' && (
                          <div className="cm-report-actions">
                            <span className="cm-report-reporter">
                              Reported by <strong>{r.reporterName}</strong>
                            </span>
                            <div className="cm-report-actions-right">
                              <Button
                                type="text"
                                icon={<ArrowRight size={12} />}
                                iconPosition="end"
                                onClick={() => openResolveDialog(r)}
                              >
                                Review &amp; resolve
                              </Button>
                              <Button
                                danger
                                type="primary"
                                icon={<EyeOff size={12} />}
                                onClick={() => quickHide(r.id)}
                              >
                                Hide
                              </Button>
                              <Button
                                type="text"
                                onClick={() => quickDismiss(r.id)}
                              >
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'posts',
            label: (
              <span className="cm-tab-label">
                All posts <span className="cm-tab-count">{posts.length}</span>
              </span>
            ),
            children: (
              <div className="cm-tab-body">
                <Card bordered={false} className="ac-panel cm-posts-panel">
                  <Table<PostRow>
                    rowKey="id"
                    pagination={false}
                    columns={postColumns}
                    dataSource={posts}
                    className="cm-posts-table"
                    onRow={(row) => ({
                      onClick: (e) => {
                        // The Hide/Unhide button shares the row click area; let
                        // the button's own onClick fire and skip the modal.
                        const target = e.target as HTMLElement | null;
                        if (target?.closest('button')) return;
                        setOpenPost(row);
                      },
                      style: { cursor: 'pointer' },
                    })}
                  />
                </Card>
              </div>
            ),
          },
          {
            key: 'users',
            label: <span className="cm-tab-label">User activity</span>,
            children: (
              <div className="cm-tab-body">
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={8}>
                    <Card bordered={false} className="cm-user-card">
                      <div className="cm-user-list-label">COMMUNITY CONTRIBUTORS</div>
                      <div className="cm-user-list">
                        {flaggedUsers.length === 0 && (
                          <div className="cm-user-list-empty">
                            No one has posted or commented yet.
                          </div>
                        )}
                        {flaggedUsers.map((u) => {
                          const initials = (u.name || 'M')
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((s) => s[0]?.toUpperCase() ?? '')
                            .join('');
                          // Activity line: posts + comments. Flag tag only when
                          // there are actual flags so the typical row stays calm.
                          const activityBits = [
                            u.postCount ? `${u.postCount} post${u.postCount === 1 ? '' : 's'}` : null,
                            u.commentCount
                              ? `${u.commentCount} comment${u.commentCount === 1 ? '' : 's'}`
                              : null,
                          ].filter(Boolean);
                          return (
                            <button
                              key={u.id}
                              type="button"
                              className={`cm-user-list-item ${selectedUserId === u.id ? 'cm-user-list-item--on' : ''}`}
                              onClick={() => setSelectedUserId(u.id)}
                            >
                              <div className="ac-avatar ac-avatar--sm" style={avatarStyleForId(u.id)}>
                                {initials}
                              </div>
                              <div className="cm-user-list-item-main">
                                <div className="cm-user-list-item-name">{u.name}</div>
                                <div className="cm-user-list-item-meta">
                                  {activityBits.length ? activityBits.join(' · ') : 'No content yet'}
                                </div>
                              </div>
                              {u.flagCount > 0 && (
                                <span className="cm-user-list-item-flag">
                                  <FlagIcon size={10} /> {u.flagCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </Card>

                    {selectedFlagged && (
                      <Card bordered={false} className="cm-user-card cm-user-profile-card">
                        {/* Quiet ⋯ menu in the corner instead of a loud red
                            "Suspend" button — destructive actions shouldn't be
                            the most prominent thing on a contributor card. */}
                        <Dropdown
                          trigger={['click']}
                          placement="bottomRight"
                          menu={{
                            items: [
                              {
                                key: 'suspend',
                                danger: true,
                                icon: <Ban size={13} />,
                                label: 'Suspend from community',
                                onClick: () => {
                                  // Suspension is a v1.1 follow-up; the row is
                                  // visible so admins know it's coming.
                                  window.alert(
                                    'Suspension lands in v1.1 — for now use the Hide / Delete actions on a per-post basis.',
                                  );
                                },
                              },
                            ],
                          }}
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={<MoreHorizontal size={16} />}
                            className="cm-user-profile-menu-btn"
                            aria-label="More actions"
                          />
                        </Dropdown>

                        <div className="ac-avatar ac-avatar--lg" style={avatarStyleForId(selectedFlagged.id)}>
                          {(selectedFlagged.name || 'M')
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((s) => s[0]?.toUpperCase() ?? '')
                            .join('')}
                        </div>
                        <div className="cm-user-profile-name">{selectedFlagged.name}</div>
                        <div className="cm-user-profile-handle">{selectedFlagged.id.slice(0, 8)}…</div>

                        <div className="cm-user-profile-stats">
                          <div>
                            <div className="cm-user-profile-stat-value">{selectedFlagged.flagCount}</div>
                            <div className="cm-user-profile-stat-label">Flags</div>
                          </div>
                          <div>
                            <div className="cm-user-profile-stat-value">{selectedFlagged.hiddenCount}</div>
                            <div className="cm-user-profile-stat-label">Hidden</div>
                          </div>
                          <div>
                            <div className="cm-user-profile-stat-value">
                              {selectedFlagged.postCount + selectedFlagged.commentCount}
                            </div>
                            <div className="cm-user-profile-stat-label">Activity</div>
                          </div>
                        </div>
                      </Card>
                    )}
                  </Col>

                  <Col xs={24} lg={16}>
                    <Card bordered={false} className="ac-panel cm-activity-panel">
                      <div className="cm-activity-head">
                        <span className="cm-activity-eyebrow">
                          ACTIVITY TIMELINE &middot; POSTS &amp; COMMENTS
                        </span>
                      </div>
                      <div className="cm-activity-list">
                        {!selectedUserId && (
                          <div className="cm-user-list-empty">
                            Pick a flagged user to see their activity.
                          </div>
                        )}
                        {(userActivity?.posts ?? []).map((p) => (
                          <div key={`p-${p.id}`} className="cm-activity-item">
                            <div className="cm-activity-icon">
                              <FlagIcon size={14} />
                            </div>
                            <div className="cm-activity-main">
                              <div className="cm-activity-meta">
                                <span className="cm-activity-kind">POST</span>
                                <AcPill variant={CATEGORY_PILL[p.category as Category]}>
                                  {CATEGORY_COPY[p.category as Category]}
                                </AcPill>
                                <span className="cm-activity-time">
                                  {new Date(p.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <div
                                className={`cm-activity-body ${p.isHidden ? 'cm-activity-body--hidden' : ''}`}
                              >
                                {p.body.slice(0, 220)}
                              </div>
                            </div>
                            <div className="cm-activity-right">
                              {p.isHidden && <AcPill variant="amber">HIDDEN</AcPill>}
                            </div>
                          </div>
                        ))}
                        {(userActivity?.comments ?? []).map((c) => (
                          <div key={`c-${c.id}`} className="cm-activity-item">
                            <div className="cm-activity-icon">
                              <MessageSquare size={14} />
                            </div>
                            <div className="cm-activity-main">
                              <div className="cm-activity-meta">
                                <span className="cm-activity-kind">COMMENT</span>
                                <span className="cm-activity-time">
                                  {new Date(c.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <div
                                className={`cm-activity-body ${c.isHidden ? 'cm-activity-body--hidden' : ''}`}
                              >
                                {c.body.slice(0, 220)}
                              </div>
                            </div>
                            <div className="cm-activity-right">
                              {c.isHidden && <AcPill variant="amber">HIDDEN</AcPill>}
                            </div>
                          </div>
                        ))}
                        {selectedUserId &&
                          (userActivity?.posts.length ?? 0) === 0 &&
                          (userActivity?.comments.length ?? 0) === 0 && (
                            <div className="cm-user-list-empty">No activity in the last 100 entries.</div>
                          )}
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>
            ),
          },
        ]}
      />

      {/* ── Resolve report modal ─────────────────────────── */}
      <Modal
        open={!!resolveReport}
        onCancel={() => setResolveReport(null)}
        footer={null}
        width={520}
        className="cm-resolve-modal"
        closeIcon={<X size={16} />}
      >
        {resolveReport && (
          <>
            <div className="cm-resolve-eyebrow">
              RESOLVE REPORT &middot; {resolveReport.id.toUpperCase()}
            </div>
            <h3 className="cm-resolve-title">Decide on this {resolveReport.target}</h3>

            <div className="cm-resolve-target">
              <div className="cm-resolve-author">
                <div
                  className="ac-avatar ac-avatar--sm"
                  style={avatarStyleForId(resolveReport.authorHandle)}
                >
                  {initialsFromName(resolveReport.authorName)}
                </div>
                <span className="cm-resolve-author-name">{resolveReport.authorName}</span>
                <span className="cm-resolve-author-handle">{resolveReport.authorHandle}</span>
                <AcPill variant={CATEGORY_PILL[resolveReport.authorCategory]}>
                  {CATEGORY_COPY[resolveReport.authorCategory]}
                </AcPill>
              </div>
              <div className="cm-resolve-quote">&ldquo;{resolveReport.body}&rdquo;</div>
            </div>

            <div className="cm-resolve-meta">
              <div className="cm-resolve-meta-cell cm-resolve-meta-cell--reason">
                <div className="cm-resolve-meta-label">REASON</div>
                <div className="cm-resolve-meta-value">{REASON_COPY[resolveReport.reason]}</div>
              </div>
              <div className="cm-resolve-meta-cell">
                <div className="cm-resolve-meta-label">REPORTED BY</div>
                <div className="cm-resolve-meta-value">{resolveReport.reporterName}</div>
              </div>
            </div>

            <div className="cm-resolve-reporter-note">
              <strong>Reporter note:</strong> {resolveReport.reporterNote}
            </div>

            <div className="cm-resolve-action-label">ACTION</div>
            <div className="cm-resolve-actions">
              <button
                type="button"
                className={`cm-resolve-action ${resolveAction === 'HIDE' ? 'cm-resolve-action--on cm-resolve-action--hide' : ''}`}
                onClick={() => setResolveAction('HIDE')}
              >
                <div className="cm-resolve-action-title">
                  <EyeOff size={14} /> Hide content
                </div>
                <div className="cm-resolve-action-sub">Removes from feed &middot; revokes coins</div>
              </button>
              <button
                type="button"
                className={`cm-resolve-action ${resolveAction === 'DISMISS' ? 'cm-resolve-action--on' : ''}`}
                onClick={() => setResolveAction('DISMISS')}
              >
                <div className="cm-resolve-action-title">
                  <CheckCircle2 size={14} /> Dismiss
                </div>
                <div className="cm-resolve-action-sub">No violation &middot; keep live</div>
              </button>
            </div>

            <Input.TextArea
              placeholder="Resolution note (logged to audit trail)…"
              rows={3}
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              className="cm-resolve-note"
            />

            <div className="cm-resolve-footer">
              <code className="cm-resolve-audit">auditAction=community.moderate</code>
              <div className="cm-resolve-footer-actions">
                <Button onClick={() => setResolveReport(null)}>Cancel</Button>
                <Button
                  type="primary"
                  disabled={!resolveAction}
                  onClick={confirmResolve}
                  icon={resolveAction === 'HIDE' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                >
                  {resolveAction === 'HIDE' ? 'Hide content' : resolveAction === 'DISMISS' ? 'Dismiss' : 'Choose an action'}
                </Button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* ── Post detail modal (opened from "All posts" row click) ── */}
      <Modal
        open={!!liveOpenPost}
        onCancel={() => setOpenPost(null)}
        footer={null}
        width={640}
        className="cm-post-modal"
        closeIcon={<X size={16} />}
      >
        {liveOpenPost && (
          <>
            <div className="cm-post-modal-head">
              {liveOpenPost.authorAvatarUrl ? (
                <img
                  className="ac-avatar ac-avatar--md cm-post-modal-avatar"
                  src={resolveMediaUrl(liveOpenPost.authorAvatarUrl)}
                  alt={liveOpenPost.authorName}
                />
              ) : (
                <div
                  className="ac-avatar ac-avatar--md"
                  style={avatarStyleForId(liveOpenPost.authorId)}
                >
                  {initialsFromName(liveOpenPost.authorName)}
                </div>
              )}
              <div className="cm-post-modal-author">
                <div className="cm-post-modal-author-name">{liveOpenPost.authorName}</div>
                <div className="cm-post-modal-author-meta">
                  {new Date(liveOpenPost.createdAtIso).toLocaleString()}
                  {liveOpenPost.pinned && (
                    <>
                      {' · '}
                      <Pin size={11} /> Pinned
                    </>
                  )}
                </div>
              </div>
              <AcPill variant={CATEGORY_PILL[liveOpenPost.category]}>
                {CATEGORY_COPY[liveOpenPost.category]}
              </AcPill>
            </div>

            <div className="cm-post-modal-body">
              {liveOpenPost.body.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            {liveOpenPost.mediaUrls.length > 0 && (
              <div className="cm-post-modal-media">
                {liveOpenPost.mediaUrls.map((url, i) => (
                  <a
                    key={`${url}-${i}`}
                    href={resolveMediaUrl(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src={resolveMediaUrl(url)} alt={`Attachment ${i + 1}`} />
                  </a>
                ))}
              </div>
            )}

            <div className="cm-post-modal-stats">
              <div className="cm-post-modal-stat">
                <Heart size={12} /> {liveOpenPost.likes} likes
              </div>
              <div className="cm-post-modal-stat">
                <MessageSquare size={12} /> {liveOpenPost.replies} replies
              </div>
              <div className="cm-post-modal-stat">
                <Bookmark size={12} /> {liveOpenPost.saves} saved
              </div>
              <div className="cm-post-modal-stat">
                <Eye size={12} /> {liveOpenPost.views} views
              </div>
              <div className="cm-post-modal-stat">
                <FlagIcon size={12} />{' '}
                {liveOpenPost.flags > 0 ? `${liveOpenPost.flags} flags` : 'No flags'}
              </div>
            </div>

            {liveOpenPost.status === 'HIDDEN' && (
              <div className="cm-post-modal-banner cm-post-modal-banner--warn">
                <EyeOff size={14} /> Hidden from the feed.
                {liveOpenPost.hiddenReason ? ` Reason: ${liveOpenPost.hiddenReason}` : ''}
              </div>
            )}
            {liveOpenPost.isAutoFlagged && (
              <div className="cm-post-modal-banner cm-post-modal-banner--warn">
                <AlertTriangle size={14} /> Auto-flagged by Gemini classifier — review before unhiding.
              </div>
            )}

            <div className="cm-post-modal-footer">
              <a
                href={`/community/post/${liveOpenPost.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cm-post-modal-permalink"
              >
                <ExternalLink size={12} /> Open in feed
              </a>
              <div className="cm-post-modal-footer-actions">
                <Button onClick={() => setOpenPost(null)}>Close</Button>
                <Button
                  icon={liveOpenPost.status === 'HIDDEN' ? <Eye size={12} /> : <EyeOff size={12} />}
                  onClick={() => togglePostHidden(liveOpenPost.id)}
                >
                  {liveOpenPost.status === 'HIDDEN' ? 'Unhide' : 'Hide'}
                </Button>
                <Button
                  danger
                  icon={<Trash2 size={12} />}
                  onClick={() => handleAdminDelete(liveOpenPost.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
