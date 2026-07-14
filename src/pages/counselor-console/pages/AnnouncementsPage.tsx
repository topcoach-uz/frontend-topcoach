import { Button, Form, Input, Skeleton, message } from 'antd';
import { Building2, Megaphone, Send, Users } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useCounselorConsole } from '../CounselorConsoleContext';
import {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  type OrgAnnouncement,
} from 'src/app/services/orgAdminApi';
import './AnnouncementsPage.scss';

dayjs.extend(relativeTime);

interface ComposeValues {
  title: string;
  message: string;
}

export default function CounselorConsoleAnnouncementsPage() {
  const { orgId, org } = useCounselorConsole();
  const [form] = Form.useForm<ComposeValues>();

  const { data, isLoading, isFetching, isError, refetch } =
    useGetAnnouncementsQuery(orgId as string, { skip: !orgId });
  const [createAnnouncement, { isLoading: sending }] =
    useCreateAnnouncementMutation();

  const items: OrgAnnouncement[] = data?.items ?? [];

  const header = (
    <div className="cc-page-head--ruled">
      <div className="cc-page-eyebrow">
        <span className="cc-page-eyebrow-accent">Communication</span>
        {org ? <span>· {org.name}</span> : null}
      </div>
      <h1 className="cc-page-title">Announcements</h1>
      <p className="cc-page-lead">
        Send an announcement to every student in {org?.name ?? 'your organization'}.
        They’ll receive it in their notifications.
      </p>
    </div>
  );

  // ── No organization selected ──
  if (!orgId) {
    return (
      <div className="cc-ann">
        {header}
        <div className="cc-placeholder">
          <Building2 size={22} color="#7b1f2f" />
          <div className="cc-placeholder-title">Select an organization</div>
          <div className="cc-placeholder-text">
            Choose an organization from the switcher to send announcements.
          </div>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    if (!orgId) return;
    let values: ComposeValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    try {
      const result = await createAnnouncement({
        orgId,
        title: values.title.trim(),
        message: values.message.trim(),
      }).unwrap();
      message.success(
        `Announcement sent to ${result.recipientCount.toLocaleString()} student${
          result.recipientCount === 1 ? '' : 's'
        }`,
      );
      form.resetFields();
    } catch (err: any) {
      const reason =
        err?.data?.message ||
        (Array.isArray(err?.data?.message) ? err.data.message[0] : null) ||
        'Could not send the announcement. Please try again.';
      message.error(String(reason));
    }
  };

  return (
    <div className="cc-ann">
      {header}

      <div className="cc-ann-layout">
        {/* ── Compose ── */}
        <section className="cc-ann-card cc-ann-compose">
          <div className="cc-ann-card-head">
            <span className="cc-ann-card-ico">
              <Megaphone size={16} />
            </span>
            <div>
              <h2 className="cc-ann-card-title">New announcement</h2>
              <p className="cc-ann-card-sub">
                Every active student receives this in their notifications.
              </p>
            </div>
          </div>

          <Form form={form} layout="vertical" requiredMark={false}>
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'A title is required' }]}
            >
              <Input placeholder="e.g. Early-decision deadlines are approaching" maxLength={120} />
            </Form.Item>
            <Form.Item
              name="message"
              label="Message"
              rules={[{ required: true, message: 'A message is required' }]}
            >
              <Input.TextArea
                rows={5}
                maxLength={2000}
                showCount
                placeholder="Write your announcement…"
              />
            </Form.Item>
            <div className="cc-ann-compose-actions">
              <Button
                className="cc-ann-primary"
                type="primary"
                onClick={handleSend}
                loading={sending}
              >
                <Send size={15} /> Send to all students
              </Button>
            </div>
          </Form>
        </section>

        {/* ── History ── */}
        <section className="cc-ann-card cc-ann-history">
          <div className="cc-ann-card-head">
            <div>
              <h2 className="cc-ann-card-title">History</h2>
              <p className="cc-ann-card-sub">
                {items.length > 0
                  ? `${items.length} announcement${items.length === 1 ? '' : 's'} sent.`
                  : 'Past announcements appear here.'}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="cc-ann-skeleton">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="cc-ann-skel-item">
                  <Skeleton active title={{ width: '60%' }} paragraph={{ rows: 2 }} />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="cc-ann-empty">
              <div className="cc-ann-empty-title">Couldn’t load history</div>
              <div>Something went wrong fetching announcements.</div>
              <Button className="cc-ann-ghost" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="cc-ann-empty">
              <span className="cc-ann-empty-ico">
                <Megaphone size={20} />
              </span>
              <div className="cc-ann-empty-title">No announcements yet</div>
              <div>Your first announcement to students will show up here.</div>
            </div>
          ) : (
            <ul className="cc-ann-list" aria-busy={isFetching}>
              {items.map((a) => (
                <li key={a.id} className="cc-ann-item">
                  <div className="cc-ann-item-head">
                    <span className="cc-ann-item-title">{a.title}</span>
                    <span
                      className="cc-ann-item-date"
                      title={dayjs(a.createdAt).format('lll')}
                    >
                      {dayjs(a.createdAt).fromNow()}
                    </span>
                  </div>
                  <p className="cc-ann-item-message">{a.message}</p>
                  <div className="cc-ann-item-meta">
                    <span className="cc-ann-item-recipients">
                      <Users size={13} /> {a.recipientCount.toLocaleString()} recipient
                      {a.recipientCount === 1 ? '' : 's'}
                    </span>
                    {a.sentBy ? (
                      <span className="cc-ann-item-by">by {a.sentBy}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
