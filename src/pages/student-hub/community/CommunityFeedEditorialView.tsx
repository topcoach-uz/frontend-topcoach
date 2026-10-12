/**
 * Community Feed (editorial). Cream surfaces, hairline borders,
 * serif headlines, brand-red accents. Layout: main column + right rail.
 * Plugged into CommunityHubMockPage when activeSection === 'feed'.
 * v1 Phase 2: data comes from communityFeedApi.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Flag,
  Image as ImageIcon,
  Pin,
  Send,
  ArrowUp,
  Link2,
  MessageCircle,
  Bookmark as BookmarkPlus,
  X,
  ChevronDown,
  Coins,
  TrendingUp,
  GraduationCap,
  Star,
  Search,
  Hash,
  MoreHorizontal,
  Copy,
  Trash2,
  Pin as PinIcon,
  PinOff,
  Compass,
  Pencil,
  BarChart3,
  Plus,
  Lock,
  HelpCircle,
  Check,
  CheckCheck,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import dayjs from 'dayjs';
import { message } from 'antd';
import CommunityReportDialog from '../../community/CommunityReportDialog';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMentorSessions } from 'src/hooks/useMentorSessions';
import {
  useCreateCommentMutation,
  useCreatePostMutation,
  useDeletePostMutation,
  useUpdatePostMutation,
  useToggleCommentLikeMutation,
  useVotePollMutation,
  useClosePollMutation,
  useMarkAnswerMutation,
  useUnmarkAnswerMutation,
  useLeaderboardQuery,
  useListCommentsQuery,
  useListPostsQuery,
  useListSavedPostsQuery,
  usePinPostMutation,
  useTogglePostLikeMutation,
  useTogglePostSaveMutation,
  useTopMentorsQuery,
  useTrendingQuery,
  useTrendingHashtagsQuery,
  useUploadPostImageMutation,
  type CommunityComment as ApiComment,
  type CommunityPost as ApiPost,
  type CommunityPoll,
} from 'src/app/services/communityFeedApi';
import {
  useGetConversationsQuery,
  useSendMessageMutation,
} from 'src/app/services/chat/chatApi';
import { MessageType } from 'src/app/services/chat/types';
import { useCommunitySocket } from 'src/lib/socket/communitySocket';
import { hostName } from 'src/app/services/api/const';
import { ApplicantPage } from '../applicant/ApplicantPage';
import './CommunityFeedEditorialView.scss';

/**
 * Avatar / media URLs from the backend can be relative (`/uploads/...`)
 * or already absolute (`https://...` or `http://...`). Prepend the API
 * host when relative so the `<img>` works from the Vite dev server too.
 */
const resolveMediaUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${hostName}${url.startsWith('/') ? '' : '/'}${url}`;
};

type Category =
  | 'ADMISSIONS'
  | 'COLLEGE_LIFE'
  | 'STUDY_ABROAD'
  | 'EXAM_PREP'
  | 'WELLNESS'
  | 'RESEARCH'
  | 'GENERAL';

const CATEGORY_META: Record<Category, { label: string; dot: string }> = {
  ADMISSIONS: { label: 'Admissions', dot: '#7B1F2F' },
  COLLEGE_LIFE: { label: 'College Life', dot: '#3D5AFE' },
  STUDY_ABROAD: { label: 'Study Abroad', dot: '#1F6B4B' },
  EXAM_PREP: { label: 'Exam Prep', dot: '#C58A1F' },
  WELLNESS: { label: 'Wellness', dot: '#6E3FB0' },
  RESEARCH: { label: 'Research', dot: '#2A5566' },
  GENERAL: { label: 'General', dot: '#6b6258' },
};

type Persona = 'OFFICIAL' | 'COACH' | null;

type Author = {
  name: string;
  subtitle: string;
  initials: string;
  avatarColor: string;
  avatarUrl: string | null;
  persona: Persona;
};

type Post = {
  id: string;
  authorId: string;
  createdAtIso: string;
  pinned?: boolean;
  pinnedBy?: string;
  author: Author;
  timeAgo: string;
  category: Category;
  body: string;
  mediaUrls: string[];
  /** Inline poll (v1.1). Null when the post is text/image-only. */
  poll: CommunityPoll | null;
  /** Stack-Overflow-style question post (v1.2). */
  kind: 'STANDARD' | 'QUESTION';
  answeredCommentId: string | null;
  likes: number;
  comments: number;
  saves: number;
  views: number;
};

type Comment = {
  id: string;
  author: Pick<Author, 'name' | 'initials' | 'avatarColor' | 'avatarUrl'>;
  body: string;
  timeAgo: string;
  likes: number;
  /** Whether the *viewer* has liked this comment. Drives the heart fill. */
  likedByMe: boolean;
  replies?: Comment[];
};

/* ─── mock data ─────────────────────────────────────────────── */


const HOUSE_RULES = [
  'Be specific — vague questions get vague answers.',
  'No buying, selling, or sharing of test material.',
  'Keep it kind. Disagree with ideas, never people.',
  "Report, don't pile on. Our team reviews every flag.",
];


/* ─── API → UI adapters ──────────────────────────────────────── */

const AVATAR_PALETTE = ['#7B1F2F', '#2A4A8B', '#2E6E4E', '#6E3FB0', '#2A5566', '#C58A1F', '#3D5AFE'];

const colorForId = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

const initialsFromName = (name: string): string =>
  (name || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('');

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const personaFor = (p: ApiPost): Persona => {
  if (p.postingPersona === 'OFFICIAL') return 'OFFICIAL';
  if (p.postingPersona === 'COACH') return 'COACH';
  return null;
};

const toUiPost = (p: ApiPost): Post => ({
  id: p.id,
  authorId: p.authorId,
  createdAtIso: p.createdAt,
  pinned: p.isPinned,
  pinnedBy: p.isPinned ? 'Top Coach' : undefined,
  author: {
    name: p.author?.name ?? 'Member',
    subtitle:
      p.postingPersona === 'OFFICIAL'
        ? `Official · ${timeAgo(p.createdAt)}`
        : `${timeAgo(p.createdAt)}`,
    initials: initialsFromName(p.author?.name ?? 'Member'),
    avatarColor: colorForId(p.authorId),
    avatarUrl: p.author?.avatarUrl ?? null,
    persona: personaFor(p),
  },
  timeAgo: timeAgo(p.createdAt),
  category: p.category as Category,
  body: p.body,
  mediaUrls: p.mediaUrls ?? [],
  poll: p.poll ?? null,
  kind: p.postKind === 'QUESTION' ? 'QUESTION' : 'STANDARD',
  answeredCommentId: p.answeredCommentId ?? null,
  likes: p.likeCount,
  comments: p.commentCount,
  saves: p.savedCount,
  views: p.viewCount,
});

const toUiComment = (c: ApiComment): Comment => ({
  id: c.id,
  author: {
    name: c.author?.name ?? 'Member',
    initials: initialsFromName(c.author?.name ?? 'Member'),
    avatarColor: colorForId(c.authorId),
    avatarUrl: c.author?.avatarUrl ?? null,
  },
  body: c.body,
  timeAgo: timeAgo(c.createdAt),
  likes: c.likeCount,
  likedByMe: !!c.isLikedByMe,
  replies: c.replies?.map(toUiComment),
});

/* ─── helpers ───────────────────────────────────────────────── */

const compactNumber = (n: number): string => {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${Math.round(n / 1000)}k`;
};

/**
 * Same shapes as the backend's MENTION_PATTERN / HASHTAG_PATTERN so
 * what the user sees is exactly what the server will resolve.
 * Group 1 = preceding char (whitespace or start), group 2 = the token.
 */
const MENTION_RE = /(^|[^A-Za-z0-9_])@([A-Za-z0-9_.]{2,32})/g;
const HASHTAG_RE = /(^|[^A-Za-z0-9_])#([A-Za-z][A-Za-z0-9_]{1,29})/g;
const URL_RE = /https?:\/\/[^\s<]+/g;

/**
 * Wrap @mentions and #hashtags in a single pass so we never double-
 * process the same line. Mentions link to `/users/@handle`; hashtags
 * fire `onTagClick(tag)` which scopes the feed to that tag — we don't
 * route to a separate page because the feed itself already supports
 * the filter.
 */
const renderMentionableLine = (
  line: string,
  keyPrefix: string,
  onTagClick?: (tag: string) => void,
): React.ReactNode[] => {
  // Find all token matches up front, sort by position, then walk the
  // line once stitching plain text between them.
  type Token =
    | { kind: 'mention'; start: number; end: number; handle: string }
    | { kind: 'hashtag'; start: number; end: number; tag: string }
    | { kind: 'link'; start: number; end: number; url: string };
  const tokens: Token[] = [];

  // URLs first: they sort earliest at their position, so the overlap
  // guard below keeps @/# fragments inside a URL from double-matching.
  const uRe = new RegExp(URL_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = uRe.exec(line)) !== null) {
    // Trailing sentence punctuation belongs to the prose, not the URL.
    const url = m[0].replace(/[.,;:!?)\]]+$/, '');
    if (!url) continue;
    tokens.push({ kind: 'link', start: m.index, end: m.index + url.length, url });
  }

  const mRe = new RegExp(MENTION_RE.source, 'g');
  while ((m = mRe.exec(line)) !== null) {
    const start = m.index + m[1].length;
    tokens.push({ kind: 'mention', start, end: start + m[2].length + 1, handle: m[2] });
  }
  const hRe = new RegExp(HASHTAG_RE.source, 'g');
  while ((m = hRe.exec(line)) !== null) {
    const start = m.index + m[1].length;
    tokens.push({ kind: 'hashtag', start, end: start + m[2].length + 1, tag: m[2] });
  }
  tokens.sort((a, b) => a.start - b.start);

  const out: React.ReactNode[] = [];
  let cursor = 0;
  let i = 0;
  for (const t of tokens) {
    if (t.start < cursor) continue; // overlap — keep the earlier match
    if (t.start > cursor) out.push(line.slice(cursor, t.start));
    if (t.kind === 'link') {
      out.push(
        <a
          key={`u-${keyPrefix}-${i++}`}
          href={t.url}
          className="cf__link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {t.url.replace(/^https?:\/\//, '')}
        </a>,
      );
    } else if (t.kind === 'mention') {
      out.push(
        <a
          key={`m-${keyPrefix}-${i++}`}
          href={`/users/@${t.handle.toLowerCase()}`}
          className="cf__mention"
          onClick={(e) => e.stopPropagation()}
        >
          @{t.handle}
        </a>,
      );
    } else {
      const tag = t.tag.toLowerCase();
      out.push(
        <button
          type="button"
          key={`h-${keyPrefix}-${i++}`}
          className="cf__hashtag"
          onClick={(e) => {
            e.stopPropagation();
            onTagClick?.(tag);
          }}
        >
          #{t.tag}
        </button>,
      );
    }
    cursor = t.end;
  }
  if (cursor < line.length) out.push(line.slice(cursor));
  return out;
};

export const renderBody = (body: string, onTagClick?: (tag: string) => void) =>
  body.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    // Light **bold** + *italic* + @mentions + #hashtags. No full markdown lib.
    const parts: React.ReactNode[] = [];
    let buf = '';
    const flushBuf = (id: string) => {
      if (!buf) return;
      parts.push(...renderMentionableLine(buf, `${i}-${id}`, onTagClick));
      buf = '';
    };
    let i2 = 0;
    while (i2 < line.length) {
      if (line[i2] === '*' && line[i2 + 1] === '*') {
        const end = line.indexOf('**', i2 + 2);
        if (end !== -1) {
          flushBuf(`b${i2}`);
          parts.push(<strong key={`b${i}-${i2}`}>{line.slice(i2 + 2, end)}</strong>);
          i2 = end + 2;
          continue;
        }
      }
      if (line[i2] === '*') {
        const end = line.indexOf('*', i2 + 1);
        if (end !== -1) {
          flushBuf(`i${i2}`);
          parts.push(<em key={`i${i}-${i2}`}>{line.slice(i2 + 1, end)}</em>);
          i2 = end + 1;
          continue;
        }
      }
      buf += line[i2];
      i2 += 1;
    }
    flushBuf('end');
    return (
      <p key={i} className="cf__body-line">
        {parts}
      </p>
    );
  });

/* ─── component ─────────────────────────────────────────────── */

type Props = {
  readOnly?: boolean;
  currentUser: {
    id: string;
    name: string;
    initials: string;
    avatarColor: string;
    avatarUrl?: string | null;
    /** True for SuperAdmin/Admin/Owner — shows the composer + admin actions. */
    canPost: boolean;
    /** SuperAdmin only — controls Pin/Unpin in the ⋯ menu. */
    canPin: boolean;
  };
  /**
   * Shows the "Upcoming sessions" rail widget (a student's own booked
   * mentor sessions). This view is reused by the mentor console's Feed
   * page — mentors/counselors don't have `joinedSessions` as a
   * *student*, so the widget only makes sense for the student-hub
   * consumer. Defaults to `false`; the student-hub feed passes `true`
   * explicitly.
   */
  showUpcomingSessions?: boolean;
};

const CommunityFeedEditorialView: React.FC<Props> = ({
  currentUser,
  showUpcomingSessions = false,
  readOnly = false,
}) => {
  const navigate = useNavigate();
  // Only the "Upcoming sessions" widget's strings are localized via `t()` —
  // the rest of this view's copy is hardcoded English (pre-existing).
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<'ALL' | Category>('ALL');
  /**
   * Optional secondary filters layered on top of the category pills:
   *   - `activeHashtag` — clicking a #tag inside any post body, OR a
   *     tag in the right-rail Tags widget, sets this. A chip in the
   *     filter row makes the state visible + clearable.
   *   - `searchInput` is the controlled input value (every keystroke);
   *     `searchQuery` is the value we actually send to the API
   *     (debounced 250ms so we don't fire on every char).
   */
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);
  const [composerDraft, setComposerDraft] = useState('');
  const [composerCategory, setComposerCategory] = useState<Category>('ADMISSIONS');
  const [composerPin, setComposerPin] = useState(false);
  const [composerCategoryOpen, setComposerCategoryOpen] = useState(false);
  /**
   * Posting persona — only meaningful for staff.
   *  - 'OFFICIAL' renders the post under the institutional "Top Coach" voice
   *    (the maroon shield) and shows it in admin/student timelines that filter
   *    on official announcements. Use this for product news, deadlines, etc.
   *  - 'SELF' renders the post under the author's own face and name, with no
   *    OFFICIAL chip — the right choice for a personal note from an admin/coach.
   */
  const [composerPersona, setComposerPersona] = useState<'OFFICIAL' | 'SELF'>('SELF');
  const [composerCopiedToast, setComposerCopiedToast] = useState<string | null>(null);

  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const [sharePopoverId, setSharePopoverId] = useState<string | null>(null);
  /**
   * When the user picks "Send to a chat" inside the share popover, we
   * switch the popover's contents from copy-link mode → conversation
   * picker mode. The popover stays anchored to the same post so the
   * focus context is preserved.
   */
  const [shareChatPickerForId, setShareChatPickerForId] = useState<string | null>(null);
  const [shareChatFilter, setShareChatFilter] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  /**
   * Inline-edit state. Authors get a 15-minute edit window after posting;
   * staff (canPost) can edit any post any time. The backend enforces this
   * too — we just gate the menu item so the UX matches.
   */
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportKind, setReportKind] = useState<'post' | 'comment'>('post');
  /**
   * 'feed' = chronological + pinned firehose (default).
   * 'saved' = just the posts the current user has bookmarked.
   * Toggled from the left sidebar "Saved" entry — keeps the same layout +
   * widgets so users don't lose their place.
   */
  const [viewMode, setViewMode] = useState<'feed' | 'saved'>('feed');

  const { newPostCount, clearNewPostCount } = useCommunitySocket();
  const feedTopRef = useRef<HTMLDivElement>(null);

  /**
   * LinkedIn-style scroll model: while the feed is mounted, hand the
   * scroll back to the document so the single scrollbar appears at the
   * browser edge — not at the inner `.main-content` panel edge. Sticky
   * sidebars (left nav + right rail) continue to work because they're
   * sticking to the viewport either way; they just travel correctly
   * through the full page now.
   *
   * Scoped via a body class so other student-hub sections (Messages,
   * Research Prep) keep their inner-scroll behavior. The class is set
   * on the documentElement so the global rule in this file's SCSS can
   * cascade into the parent layout's `.main-content`.
   */
  useEffect(() => {
    document.body.classList.add('cf-feed-active');
    return () => { document.body.classList.remove('cf-feed-active'); };
  }, []);

  /* ─── data ────────────────────────────────────────────────── */
  const {
    data: postsPage,
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useListPostsQuery(
    {
      category: activeCategory === 'ALL' ? undefined : activeCategory,
      hashtag: activeHashtag ?? undefined,
      q: searchQuery || undefined,
    },
    { skip: viewMode === 'saved' },
  );
  const {
    data: savedPage,
    isLoading: savedLoading,
    refetch: refetchSaved,
  } = useListSavedPostsQuery(undefined, { skip: viewMode !== 'saved' });
  // True while the ACTIVE view's list is fetching with no cached data yet
  // (cold load or a new filter/search combination). Used to show post
  // skeletons instead of flashing the "You're all caught up." end-cap.
  const feedLoading = viewMode === 'saved' ? savedLoading : postsLoading;

  const apiPosts = useMemo(
    () => (viewMode === 'saved' ? savedPage?.items ?? [] : postsPage?.items ?? []),
    [viewMode, postsPage, savedPage],
  );

  const uiPosts: Post[] = useMemo(() => apiPosts.map(toUiPost), [apiPosts]);
  const likedIds = useMemo(() => {
    const map: Record<string, boolean> = {};
    apiPosts.forEach((p) => { if (p.isLikedByMe) map[p.id] = true; });
    return map;
  }, [apiPosts]);
  const savedIds = useMemo(() => {
    const map: Record<string, boolean> = {};
    apiPosts.forEach((p) => { if (p.isSavedByMe) map[p.id] = true; });
    return map;
  }, [apiPosts]);

  /* ─── mutations ──────────────────────────────────────────── */
  const [createPost] = useCreatePostMutation();
  const [togglePostLikeMut] = useTogglePostLikeMutation();
  const [togglePostSaveMut] = useTogglePostSaveMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadPostImageMutation();
  const [pinPostMut] = usePinPostMutation();
  const [deletePostMut] = useDeletePostMutation();
  const [updatePostMut, { isLoading: isSavingEdit }] = useUpdatePostMutation();
  const [votePoll] = useVotePollMutation();
  const [closePoll] = useClosePollMutation();
  const [markAnswerMut] = useMarkAnswerMutation();
  const [unmarkAnswerMut] = useUnmarkAnswerMutation();

  /* ─── right-rail live data ───────────────────────────────── */
  const { data: leaderboard = [] } = useLeaderboardQuery({ period: 'month', limit: 3 });
  const { data: trending = [] } = useTrendingQuery(3);
  const { data: topMentors = [] } = useTopMentorsQuery(3);
  const { data: trendingTags = [] } = useTrendingHashtagsQuery(8);
  // Same source + classification as My Progress's "Mentor sessions" card
  // (`useMentorSessions` → `profile.joinedSessions`) so the two surfaces
  // never disagree. Only rendered for the student-hub consumer — see
  // `showUpcomingSessions` on Props.
  const { upcomingSessions } = useMentorSessions();

  /** Persisted dismiss for House Rules. */
  const [houseRulesDismissed, setHouseRulesDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cf_house_rules_dismissed') === '1';
    } catch {
      return false;
    }
  });
  const dismissHouseRules = () => {
    setHouseRulesDismissed(true);
    try { localStorage.setItem('cf_house_rules_dismissed', '1'); } catch { /* SSR / private mode */ }
  };

  /** Pending image URLs to attach to the next post. */
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Composer poll draft. `null` = no poll attached. Toggle the "Poll"
   * button to show/hide the inline editor. Backend enforces 2–4 options
   * and 80-char labels — we mirror those caps client-side for nicer UX.
   */
  const [pollDraft, setPollDraft] = useState<{ question: string; options: string[] } | null>(
    null,
  );

  /**
   * Composer post kind. STANDARD is the default. Switching to QUESTION
   * relabels the submit button + placeholder so users understand they're
   * opening a question, not announcing news.
   */
  const [composerKind, setComposerKind] = useState<'STANDARD' | 'QUESTION'>('STANDARD');

  const filteredPosts = uiPosts;

  const toggleLike = (id: string) => { void togglePostLikeMut(id); };
  const toggleSave = (id: string) => { void togglePostSaveMut(id); };

  const toggleComments = (id: string) =>
    setExpandedComments((prev) => ({ ...prev, [id]: !prev[id] }));

  /**
   * Close any open popover (share, ⋯ menu) when the user clicks anywhere
   * outside it, OR presses Escape. Mirrors how LinkedIn / Twitter dismiss
   * post overflow menus — the previous build left them sticky until the
   * user clicked the trigger again.
   */
  useEffect(() => {
    if (sharePopoverId === null && menuOpenId === null && !composerCategoryOpen) return;
    const onPointer = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('.cf__share-pop') || target.closest('.cf__share-wrap')) return;
      if (target.closest('.cf__post-menu') || target.closest('.cf__post-menu-trigger')) return;
      if (target.closest('.cf__category-dropdown')) return;
      setSharePopoverId(null);
      setShareChatPickerForId(null);
      setMenuOpenId(null);
      setComposerCategoryOpen(false);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setSharePopoverId(null);
        setShareChatPickerForId(null);
        setMenuOpenId(null);
        setComposerCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [sharePopoverId, menuOpenId, composerCategoryOpen]);

  const submitPost = () => {
    const text = composerDraft.trim();
    if (!text) return;

    // Validate the optional poll before we hit the wire. Backend rejects
    // these too, but a client-side gate keeps the UX calm.
    let pollPayload: { question?: string; options: string[] } | undefined;
    if (pollDraft) {
      const cleaned = pollDraft.options.map((o) => o.trim()).filter(Boolean);
      if (cleaned.length < 2) {
        alert('A poll needs at least 2 options.');
        return;
      }
      if (cleaned.length > 4) {
        alert('A poll supports at most 4 options.');
        return;
      }
      pollPayload = {
        question: pollDraft.question.trim() || undefined,
        options: cleaned,
      };
    }

    createPost({
      body: text,
      category: composerCategory,
      pin: composerPin,
      postingPersona: composerPersona,
      mediaUrls: pendingImages.length ? pendingImages : undefined,
      poll: pollPayload,
      kind: composerKind,
    })
      .unwrap()
      .then(() => {
        setComposerDraft('');
        setComposerPin(false);
        setPendingImages([]);
        setPollDraft(null);
        setComposerKind('STANDARD');
        if (viewMode === 'saved') void refetchSaved();
        else void refetchPosts();
      })
      .catch(() => { /* slice's invalidation will handle retry; UI keeps draft */ });
  };

  /**
   * Centralised hashtag selection so every entry point (body chip,
   * trending widget, comment body) ends up in the same state. Clears
   * the search input — running both at once is rarely what the user
   * wants and adds noise to the empty state.
   */
  const applyHashtag = (tag: string) => {
    setActiveHashtag(tag.toLowerCase());
    setSearchInput('');
    setSearchQuery('');
    setViewMode('feed');
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const clearHashtag = () => setActiveHashtag(null);

  const canMarkAnswer = (post: Post): boolean =>
    post.kind === 'QUESTION' && (post.authorId === currentUser.id || currentUser.canPost);

  const handleToggleAnswer = (post: Post, commentId: string) => {
    if (!canMarkAnswer(post)) return;
    if (post.answeredCommentId === commentId) {
      void unmarkAnswerMut({ postId: post.id }).unwrap().catch(() => undefined);
    } else {
      void markAnswerMut({ postId: post.id, commentId }).unwrap().catch(() => undefined);
    }
  };

  /**
   * Cast a vote. Optimistic updates happen inside the RTK slice; here we
   * just guard against double-clicks on an already-voted poll.
   */
  const handleVote = (poll: CommunityPoll, postId: string, optionId: string) => {
    if (poll.myVoteOptionId || poll.isClosed) return;
    void votePoll({ pollId: poll.id, postId, optionId }).unwrap().catch(() => undefined);
  };

  const handleClosePoll = (poll: CommunityPoll, postId: string) => {
    if (poll.isClosed) return;
    if (!window.confirm('Close this poll? Voting will stop and results will be final.')) return;
    void closePoll({ pollId: poll.id, postId }).unwrap().catch(() => undefined);
  };

  /* ─── send-to-chat data ───────────────────────────────────── */
  /**
   * Fetch only when a chat picker is open — we don't want to pay this
   * query's cost on every feed mount. Conversations are cached anyway,
   * so the first picker open is the only slow load.
   */
  const { data: conversationsData } = useGetConversationsQuery(undefined, {
    skip: shareChatPickerForId === null,
  });
  const [sendChatMessage, { isLoading: isSendingChatMessage }] = useSendMessageMutation();

  /** Pick the "other participant" for display — mentor vs student depending on viewer. */
  const otherParticipant = (conv: { mentorId: string; studentId: string; mentor?: any; student?: any }) => {
    return conv.mentorId === currentUser.id ? conv.student : conv.mentor;
  };

  const filteredConversations = useMemo(() => {
    const all = conversationsData?.conversations ?? [];
    const needle = shareChatFilter.trim().toLowerCase();
    if (!needle) return all.slice(0, 8);
    return all
      .filter((c) => {
        const other = otherParticipant(c);
        return (other?.profile?.name ?? '').toLowerCase().includes(needle);
      })
      .slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationsData, shareChatFilter, currentUser.id]);

  const sendToChat = async (conversationId: string, postId: string) => {
    const link = `${window.location.origin}/community/post/${postId}`;
    try {
      await sendChatMessage({
        conversationId,
        message: link,
        messageType: MessageType.TEXT,
      }).unwrap();
      setShareChatPickerForId(null);
      setSharePopoverId(null);
      setShareChatFilter('');
      setComposerCopiedToast('Sent to chat');
      setTimeout(() => setComposerCopiedToast(null), 1800);
    } catch {
      // Show a soft toast — RTK will let them retry.
      setComposerCopiedToast('Could not send. Try again.');
      setTimeout(() => setComposerCopiedToast(null), 2200);
    }
  };

  const copyPostLink = (postId: string) => {
    const url = `${window.location.origin}/community/post/${postId}`;
    void navigator.clipboard?.writeText(url).catch(() => undefined);
    setComposerCopiedToast('Link copied');
    setTimeout(() => setComposerCopiedToast(null), 1800);
    setSharePopoverId(null);
    setMenuOpenId(null);
  };

  const handlePinToggle = (post: Post) => {
    setMenuOpenId(null);
    void pinPostMut({ id: post.id, pinned: !post.pinned }).unwrap().catch(() => undefined);
  };

  const handleDeletePost = (post: Post) => {
    setMenuOpenId(null);
    // Window confirm is enough for v1 — destructive, but reversible only by
    // an admin un-deleting at the SQL layer; we want a hard stop here.
    if (!window.confirm('Delete this post? This cannot be undone from the feed.')) return;
    void deletePostMut(post.id).unwrap().catch(() => undefined);
  };

  /**
   * Can the current user edit this post right now? Mirrors the backend's
   * `assertCanMutate`: staff bypass; author within 15 minutes of createdAt.
   * Kept loose-typed (Date arithmetic) since the source-of-truth check is
   * server-side — we just want a nice UX gate.
   */
  const AUTHOR_EDIT_WINDOW_MS = 15 * 60 * 1000;
  const canEditPost = (post: Post): boolean => {
    if (currentUser.canPost) return true;
    if (post.authorId !== currentUser.id) return false;
    return Date.now() - new Date(post.createdAtIso).getTime() < AUTHOR_EDIT_WINDOW_MS;
  };

  const startEdit = (post: Post) => {
    setMenuOpenId(null);
    setEditingPostId(post.id);
    setEditDraft(post.body);
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditDraft('');
  };

  const saveEdit = (post: Post) => {
    const next = editDraft.trim();
    if (!next || next === post.body) {
      cancelEdit();
      return;
    }
    void updatePostMut({ id: post.id, body: { body: next } })
      .unwrap()
      .then(() => cancelEdit())
      .catch(() => {
        // RTK keeps the draft on failure so the user doesn't lose typing.
      });
  };


  const showNewBanner = newPostCount > 0;
  const scrollToTop = () => {
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    clearNewPostCount();
    void refetchPosts();
  };

  return (
    <ApplicantPage
      title="Community Feed"
      subtitle="Ask clearly, learn together, and celebrate meaningful progress."
    >
    <div className={`cf ${readOnly ? 'cf--read-only' : ''}`} ref={feedTopRef}>
      <div className="cf__layout">
        {/* ═══ MAIN COLUMN ═════════════════════════════════════════ */}
        <main className="cf__main">
          {readOnly && <p className="cf__read-only-note">Explore the community feed. Community access is needed to post or interact.</p>}
          {/* Saved view title strip — only in saved mode, so the user knows
              what they're looking at now that the loud tab strip is gone. */}
          {viewMode === 'saved' && (
            <div className="cf__saved-strip">
              <button
                type="button"
                className="cf__saved-back"
                onClick={() => setViewMode('feed')}
                aria-label="Back to feed"
              >
                ← Back to feed
              </button>
              <div className="cf__saved-title">
                <Bookmark size={13} /> Saved posts
              </div>
            </div>
          )}

          {/* Search + active hashtag chip — only in feed view, since
              the Saved view is already filtered by bookmark. */}
          {viewMode === 'feed' && (
            <div className="cf__filter-row">
              <div className="cf__search-wrap">
                <Search size={14} className="cf__search-icon" aria-hidden />
                <input
                  type="search"
                  className="cf__search-input"
                  placeholder="Search posts…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  maxLength={80}
                  aria-label="Search community posts"
                />
                {searchInput && (
                  <button
                    type="button"
                    className="cf__search-clear"
                    onClick={() => setSearchInput('')}
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              {activeHashtag && (
                <button
                  type="button"
                  className="cf__active-tag"
                  onClick={clearHashtag}
                  title="Clear hashtag filter"
                >
                  <Hash size={11} /> {activeHashtag} <X size={11} />
                </button>
              )}
              {/* Saved view shortcut — quiet icon-only toggle that lives
                  next to the search. Replaces the old loud Feed / Saved
                  tab strip at the top of the page. */}
              <button
                type="button"
                className="cf__saved-toggle"
                onClick={() => setViewMode('saved')}
                aria-label="View saved posts"
                title="Saved posts"
              >
                <Bookmark size={14} />
                <span>Saved posts</span>
              </button>
            </div>
          )}

          {/* category filter — only meaningful in feed view */}
          {viewMode === 'feed' && (
          <div className="cf__category-row" role="tablist" aria-label="Filter feed by category">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'ALL'}
              className={`cf__category-pill ${activeCategory === 'ALL' ? 'cf__category-pill--active' : ''}`}
              onClick={() => setActiveCategory('ALL')}
            >
              All
            </button>
            {(Object.keys(CATEGORY_META) as Category[]).map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat}
                className={`cf__category-pill ${activeCategory === cat ? 'cf__category-pill--active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                <span className="cf__category-dot" style={{ background: CATEGORY_META[cat].dot }} />
                {CATEGORY_META[cat].label}
              </button>
            ))}
          </div>
          )}

          {/* composer */}
          {!readOnly && currentUser.canPost && viewMode === 'feed' && (
            <div className="cf__composer">
              <div className="cf__composer-top">
                {currentUser.avatarUrl ? (
                  <img
                    className="cf__avatar cf__avatar--md cf__avatar-img"
                    src={resolveMediaUrl(currentUser.avatarUrl)}
                    alt={currentUser.name}
                  />
                ) : (
                  <div
                    className="cf__avatar cf__avatar--md"
                    style={{ background: currentUser.avatarColor }}
                    aria-hidden
                  >
                    {currentUser.initials}
                  </div>
                )}
                <textarea
                  className="cf__composer-input"
                  placeholder={
                    composerKind === 'QUESTION'
                      ? 'Ask a specific question — include what you\'ve already tried.'
                      : 'Share something with the community…'
                  }
                  value={composerDraft}
                  onChange={(e) => setComposerDraft(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Persona toggle — only SuperAdmins can post as the institutional
                  "Top Coach Official" voice. Admins / Managers post under their
                  own face. Without two real choices the toggle would be noise,
                  so we render nothing for non-SuperAdmin posters. */}
              {currentUser.canPin && (
                <div className="cf__composer-persona" role="radiogroup" aria-label="Post as">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={composerPersona === 'SELF'}
                    className={`cf__persona-chip ${composerPersona === 'SELF' ? 'cf__persona-chip--on' : ''}`}
                    onClick={() => setComposerPersona('SELF')}
                    title="Posted under your own face and name."
                  >
                    Post as <strong>{currentUser.name.split(' ')[0]}</strong>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={composerPersona === 'OFFICIAL'}
                    className={`cf__persona-chip ${composerPersona === 'OFFICIAL' ? 'cf__persona-chip--on' : ''}`}
                    onClick={() => setComposerPersona('OFFICIAL')}
                    title="Posted as the Top Coach institutional voice — used for product news, deadlines, official announcements."
                  >
                    Post as <strong>Top Coach Official</strong>
                  </button>
                </div>
              )}

              {/* Inline poll editor — shows when the Poll toggle is on.
                  Backend caps: 2–4 options, 80-char labels, 200-char question. */}
              {pollDraft && (
                <div className="cf__poll-editor">
                  <div className="cf__poll-editor-head">
                    <BarChart3 size={13} /> POLL
                    <button
                      type="button"
                      className="cf__poll-editor-remove"
                      onClick={() => setPollDraft(null)}
                      aria-label="Remove poll"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <input
                    type="text"
                    className="cf__poll-editor-question"
                    placeholder="Ask a question (optional)"
                    value={pollDraft.question}
                    maxLength={200}
                    onChange={(e) =>
                      setPollDraft((cur) => (cur ? { ...cur, question: e.target.value } : cur))
                    }
                  />
                  <div className="cf__poll-editor-options">
                    {pollDraft.options.map((opt, i) => (
                      <div key={i} className="cf__poll-editor-option-row">
                        <input
                          type="text"
                          className="cf__poll-editor-option"
                          placeholder={`Option ${i + 1}`}
                          value={opt}
                          maxLength={80}
                          onChange={(e) =>
                            setPollDraft((cur) =>
                              cur
                                ? {
                                    ...cur,
                                    options: cur.options.map((o, idx) =>
                                      idx === i ? e.target.value : o,
                                    ),
                                  }
                                : cur,
                            )
                          }
                        />
                        {pollDraft.options.length > 2 && (
                          <button
                            type="button"
                            className="cf__poll-editor-remove-opt"
                            aria-label={`Remove option ${i + 1}`}
                            onClick={() =>
                              setPollDraft((cur) =>
                                cur
                                  ? {
                                      ...cur,
                                      options: cur.options.filter((_, idx) => idx !== i),
                                    }
                                  : cur,
                              )
                            }
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                    {pollDraft.options.length < 4 && (
                      <button
                        type="button"
                        className="cf__poll-editor-add"
                        onClick={() =>
                          setPollDraft((cur) =>
                            cur ? { ...cur, options: [...cur.options, ''] } : cur,
                          )
                        }
                      >
                        <Plus size={12} /> Add option
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Pending image previews */}
              {pendingImages.length > 0 && (
                <div className="cf__composer-previews">
                  {pendingImages.map((url, i) => (
                    <div key={url} className="cf__composer-preview">
                      <img src={resolveMediaUrl(url)} alt={`Attachment ${i + 1}`} />
                      <button
                        type="button"
                        className="cf__composer-preview-remove"
                        aria-label="Remove image"
                        onClick={() =>
                          setPendingImages((prev) => prev.filter((_, idx) => idx !== i))
                        }
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="cf__composer-toolbar">
                <div className="cf__composer-tools">
                  <div className="cf__category-dropdown">
                    <button
                      type="button"
                      className="cf__composer-chip"
                      onClick={() => setComposerCategoryOpen((v) => !v)}
                    >
                      <span
                        className="cf__category-dot"
                        style={{ background: CATEGORY_META[composerCategory].dot }}
                      />
                      {CATEGORY_META[composerCategory].label}
                      <ChevronDown size={14} />
                    </button>
                    {composerCategoryOpen && (
                      <div className="cf__category-menu" role="listbox">
                        {(Object.keys(CATEGORY_META) as Category[]).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            role="option"
                            aria-selected={composerCategory === cat}
                            className="cf__category-menu-item"
                            onClick={() => {
                              setComposerCategory(cat);
                              setComposerCategoryOpen(false);
                            }}
                          >
                            <span
                              className="cf__category-dot"
                              style={{ background: CATEGORY_META[cat].dot }}
                            />
                            {CATEGORY_META[cat].label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="cf__composer-tool-btn cf__composer-tool-btn--image"
                    aria-label="Add image"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || pendingImages.length >= 4}
                    title={pendingImages.length >= 4 ? 'Max 4 images per post' : 'Add image (PNG/JPG/GIF/WebP, 10MB max)'}
                  >
                    <ImageIcon size={16} />
                    {pendingImages.length > 0 && (
                      <span className="cf__composer-image-count">{pendingImages.length}</span>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      if (file.size > 10 * 1024 * 1024) {
                        alert('Image is too large. The cap is 10MB.');
                        return;
                      }
                      try {
                        const result = await uploadImage(file).unwrap();
                        setPendingImages((prev) => [...prev, result.url].slice(0, 4));
                      } catch {
                        alert('Upload failed. Try a different image.');
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={`cf__composer-tool-btn cf__composer-tool-btn--pin cf__composer-pin ${composerPin ? 'cf__composer-pin--on' : ''}`}
                    onClick={() => setComposerPin((v) => !v)}
                  >
                    <Pin size={14} />
                    Pin
                  </button>
                  <button
                    type="button"
                    className={`cf__composer-tool-btn cf__composer-tool-btn--poll ${pollDraft ? 'cf__composer-pin--on' : ''}`}
                    onClick={() =>
                      setPollDraft((cur) =>
                        cur ? null : { question: '', options: ['', ''] },
                      )
                    }
                    title="Add a poll (2–4 options)"
                  >
                    <BarChart3 size={14} />
                    Poll
                  </button>
                  <button
                    type="button"
                    className={`cf__composer-tool-btn cf__composer-tool-btn--question ${composerKind === 'QUESTION' ? 'cf__composer-pin--on' : ''}`}
                    onClick={() =>
                      setComposerKind((cur) => (cur === 'QUESTION' ? 'STANDARD' : 'QUESTION'))
                    }
                    title="Frame this post as a question. Lets the author mark one comment as the answer."
                  >
                    <HelpCircle size={14} />
                    Question
                  </button>
                </div>
                <div className="cf__composer-actions">
                  <span className="cf__composer-coins">+10 coins</span>
                  <button
                    type="button"
                    className="cf__btn cf__btn--primary"
                    disabled={!composerDraft.trim()}
                    onClick={submitPost}
                  >
                    {composerKind === 'QUESTION' ? 'Ask' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* new-post floating banner */}
          {showNewBanner && (
            <button type="button" className="cf__new-banner" onClick={scrollToTop}>
              <ArrowUp size={14} /> {newPostCount} new post{newPostCount === 1 ? '' : 's'}
            </button>
          )}

          {/* posts */}
          <div className="cf__posts">
            {feedLoading &&
              [0, 1, 2].map((i) => (
                <article key={`cf-sk-${i}`} className="cf__post cf__post--skeleton">
                  <div className="cf__skel-head">
                    <span className="cf__skel cf__skel--avatar" />
                    <span className="cf__skel cf__skel--line" style={{ width: '35%' }} />
                  </div>
                  <span className="cf__skel cf__skel--line" style={{ width: '95%' }} />
                  <span className="cf__skel cf__skel--line" style={{ width: '85%' }} />
                  <span className="cf__skel cf__skel--line" style={{ width: '55%' }} />
                </article>
              ))}
            {!feedLoading && filteredPosts.map((post) => {
              const liked = !!likedIds[post.id];
              const saved = !!savedIds[post.id];
              const commentsOpen = !!expandedComments[post.id];

              return (
                <article key={post.id} className="cf__post">
                  {post.pinned && (
                    <div className="cf__pinned-strip">
                      <Pin size={12} /> PINNED BY {post.pinnedBy?.toUpperCase()}
                    </div>
                  )}

                  <header className="cf__post-head">
                    {/* Avatar precedence: real photo > institutional square > initials.
                        We only fall back to the maroon OFFICIAL square when there is
                        no real avatarUrl — if the author has a face on file, we show
                        it and rely on the OFFICIAL chip below to convey persona. */}
                    {post.author.avatarUrl ? (
                      <img
                        className="cf__avatar cf__avatar--md cf__avatar-img"
                        src={resolveMediaUrl(post.author.avatarUrl)}
                        alt={post.author.name}
                      />
                    ) : (
                      <div
                        className={`cf__avatar cf__avatar--md ${post.author.persona === 'OFFICIAL' ? 'cf__avatar--official' : ''}`}
                        style={{ background: post.author.avatarColor }}
                        aria-hidden
                      >
                        {post.author.initials}
                      </div>
                    )}
                    <div className="cf__post-author">
                      <div className="cf__post-author-line">
                        <span className="cf__post-author-name">{post.author.name}</span>
                        {post.author.persona === 'OFFICIAL' && (
                          <span className="cf__badge cf__badge--official">
                            <svg width="10" height="10" viewBox="0 0 16 16" aria-hidden>
                              <path
                                fill="currentColor"
                                d="M8 0l2 4 4 0-3 3 1 4-4-2-4 2 1-4-3-3 4 0z"
                              />
                            </svg>
                            OFFICIAL
                          </span>
                        )}
                        {post.author.persona === 'COACH' && (
                          <span className="cf__badge cf__badge--coach">COACH</span>
                        )}
                      </div>
                      <div className="cf__post-author-sub">
                        {post.author.subtitle}
                      </div>
                    </div>
                    <div className="cf__post-head-right">
                      {post.kind === 'QUESTION' && (
                        <span
                          className={`cf__kind-tag ${post.answeredCommentId ? 'cf__kind-tag--answered' : ''}`}
                          title={post.answeredCommentId ? 'Answer accepted' : 'Open question'}
                        >
                          {post.answeredCommentId ? (
                            <>
                              <CheckCheck size={11} /> ANSWERED
                            </>
                          ) : (
                            <>
                              <HelpCircle size={11} /> QUESTION
                            </>
                          )}
                        </span>
                      )}
                      <span className={`cf__cat-tag cf__cat-tag--${post.category}`}>
                        {CATEGORY_META[post.category].label.toUpperCase()}
                      </span>
                      <div className="cf__post-menu-wrap">
                        <button
                          type="button"
                          className="cf__icon-btn cf__post-menu-trigger"
                          aria-label="More actions"
                          aria-haspopup="menu"
                          aria-expanded={menuOpenId === post.id}
                          onClick={() =>
                            setMenuOpenId((cur) => (cur === post.id ? null : post.id))
                          }
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {menuOpenId === post.id && (
                          <div className="cf__post-menu" role="menu">
                            <button
                              type="button"
                              role="menuitem"
                              className="cf__post-menu-item"
                              onClick={() => { toggleSave(post.id); setMenuOpenId(null); }}
                            >
                              <Bookmark size={14} />
                              {saved ? 'Remove from saved' : 'Save post'}
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="cf__post-menu-item"
                              onClick={() => copyPostLink(post.id)}
                            >
                              <Copy size={14} />
                              Copy link
                            </button>
                            {canEditPost(post) && (
                              <button
                                type="button"
                                role="menuitem"
                                className="cf__post-menu-item"
                                onClick={() => startEdit(post)}
                              >
                                <Pencil size={14} />
                                Edit post
                              </button>
                            )}
                            {currentUser.canPin && (
                              <button
                                type="button"
                                role="menuitem"
                                className="cf__post-menu-item"
                                onClick={() => handlePinToggle(post)}
                              >
                                {post.pinned ? <PinOff size={14} /> : <PinIcon size={14} />}
                                {post.pinned ? 'Unpin from top' : 'Pin to top'}
                              </button>
                            )}
                            {/* Author or admin can delete. */}
                            {(post.authorId === currentUser.id || currentUser.canPost) && (
                              <button
                                type="button"
                                role="menuitem"
                                className="cf__post-menu-item cf__post-menu-item--danger"
                                onClick={() => handleDeletePost(post)}
                              >
                                <Trash2 size={14} />
                                Delete post
                              </button>
                            )}
                            {/* Self-report is rejected server-side, hide for own posts. */}
                            {post.authorId !== currentUser.id && (
                              <button
                                type="button"
                                role="menuitem"
                                className="cf__post-menu-item"
                                onClick={() => {
                                  setReportTargetId(post.id);
                                  setReportKind('post');
                                  setMenuOpenId(null);
                                }}
                              >
                                <Flag size={14} />
                                Report
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </header>

                  {editingPostId === post.id ? (
                    <div className="cf__post-edit">
                      <textarea
                        className="cf__post-edit-input"
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        rows={Math.max(3, editDraft.split('\n').length + 1)}
                        autoFocus
                        onKeyDown={(e) => {
                          // Cmd/Ctrl+Enter to save, Esc to cancel — matches
                          // most "edit-in-place" UX patterns.
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            saveEdit(post);
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelEdit();
                          }
                        }}
                      />
                      <div className="cf__post-edit-actions">
                        <span className="cf__post-edit-hint">
                          {currentUser.canPost
                            ? 'You can edit any post.'
                            : 'Author edit window is 15 minutes.'}
                        </span>
                        <div className="cf__post-edit-buttons">
                          <button
                            type="button"
                            className="cf__btn cf__btn--ghost"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="cf__btn cf__btn--primary"
                            disabled={
                              isSavingEdit ||
                              !editDraft.trim() ||
                              editDraft.trim() === post.body
                            }
                            onClick={() => saveEdit(post)}
                          >
                            {isSavingEdit ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="cf__post-body">{renderBody(post.body, applyHashtag)}</div>
                  )}

                  {post.mediaUrls.length > 0 && (
                    <div className={`cf__media cf__media--n${Math.min(post.mediaUrls.length, 4)}`}>
                      {post.mediaUrls.slice(0, 4).map((url, i) => (
                        <a
                          key={`${url}-${i}`}
                          href={resolveMediaUrl(url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cf__media-tile"
                        >
                          <img src={resolveMediaUrl(url)} alt={`Post attachment ${i + 1}`} />
                        </a>
                      ))}
                    </div>
                  )}

                  {post.poll && (
                    <PollCard
                      poll={post.poll}
                      isAuthor={post.authorId === currentUser.id || currentUser.canPost}
                      onVote={(optionId) => handleVote(post.poll!, post.id, optionId)}
                      onClose={() => handleClosePoll(post.poll!, post.id)}
                    />
                  )}

                  <div className="cf__post-meta">
                    <span><Heart size={12} className="cf__post-meta-icon" /> {post.likes + (liked ? 0 : 0)}</span>
                    <span>{post.comments} comments</span>
                    <span>{post.saves} saved</span>
                  </div>

                  <div className="cf__post-actions">
                    <button
                      type="button"
                      className={`cf__action ${liked ? 'cf__action--on cf__action--heart-on' : ''}`}
                      onClick={() => toggleLike(post.id)}
                    >
                      <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                      <span>{post.likes}</span>
                    </button>
                    <button
                      type="button"
                      className={`cf__action ${commentsOpen ? 'cf__action--on' : ''}`}
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageSquare size={16} />
                      <span>{post.comments}</span>
                    </button>
                    <div className="cf__share-wrap">
                      <button
                        type="button"
                        className="cf__action"
                        onClick={() => setSharePopoverId(post.id === sharePopoverId ? null : post.id)}
                      >
                        <Share2 size={16} />
                        <span>Share</span>
                      </button>
                      {sharePopoverId === post.id && (
                        <div className="cf__share-pop" role="dialog" aria-label="Share this post">
                          {shareChatPickerForId === post.id ? (
                            /* Conversation picker — flips from copy-link mode. */
                            <>
                              <div className="cf__share-pop-head">
                                <button
                                  type="button"
                                  className="cf__share-back"
                                  aria-label="Back"
                                  onClick={() => {
                                    setShareChatPickerForId(null);
                                    setShareChatFilter('');
                                  }}
                                >
                                  ← Back
                                </button>
                                <div className="cf__share-pop-label">Send to a chat</div>
                              </div>
                              <input
                                type="text"
                                className="cf__share-search"
                                placeholder="Search people…"
                                value={shareChatFilter}
                                onChange={(e) => setShareChatFilter(e.target.value)}
                                autoFocus
                              />
                              <div className="cf__share-chat-list">
                                {filteredConversations.length === 0 && (
                                  <div className="cf__share-chat-empty">
                                    {shareChatFilter
                                      ? 'No matches.'
                                      : 'No conversations yet. Start one from Messages first.'}
                                  </div>
                                )}
                                {filteredConversations.map((conv) => {
                                  const other = otherParticipant(conv);
                                  const name = other?.profile?.name ?? 'Member';
                                  const avatar = other?.profile?.avatar;
                                  return (
                                    <button
                                      key={conv.id}
                                      type="button"
                                      className="cf__share-chat-item"
                                      onClick={() => sendToChat(conv.id, post.id)}
                                      disabled={isSendingChatMessage}
                                    >
                                      {avatar ? (
                                        <img
                                          className="cf__avatar cf__avatar--sm cf__avatar-img"
                                          src={resolveMediaUrl(avatar)}
                                          alt={name}
                                        />
                                      ) : (
                                        <div
                                          className="cf__avatar cf__avatar--sm"
                                          style={{ background: colorForId(other?.id ?? conv.id) }}
                                          aria-hidden
                                        >
                                          {initialsFromName(name)}
                                        </div>
                                      )}
                                      <span className="cf__share-chat-name">{name}</span>
                                      <Send size={12} className="cf__share-chat-send" />
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            /* Default mode: copy link + entry points to chat / save. */
                            <>
                              <div className="cf__share-pop-label">Share this post</div>
                              <div className="cf__share-link-row">
                                <Link2 size={14} />
                                <span className="cf__share-link">
                                  {window.location.host}/community/post/…
                                </span>
                                <button
                                  type="button"
                                  className="cf__share-copy"
                                  onClick={() => copyPostLink(post.id)}
                                >
                                  Copy
                                </button>
                              </div>
                              <button
                                type="button"
                                className="cf__share-item"
                                onClick={() => {
                                  setShareChatPickerForId(post.id);
                                  setShareChatFilter('');
                                }}
                              >
                                <Send size={14} /> Send to a chat
                              </button>
                              <button
                                type="button"
                                className="cf__share-item"
                                onClick={() => {
                                  if (!saved) toggleSave(post.id);
                                  setSharePopoverId(null);
                                }}
                              >
                                <BookmarkPlus size={14} /> {saved ? 'Already saved' : 'Save to read later'}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="cf__action-right">
                      <button
                        type="button"
                        className={`cf__action cf__action--icon ${saved ? 'cf__action--on cf__action--save-on' : ''}`}
                        onClick={() => toggleSave(post.id)}
                        aria-label={saved ? 'Saved' : 'Save'}
                      >
                        <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        type="button"
                        className="cf__action cf__action--icon"
                        onClick={() => {
                          setReportTargetId(post.id);
                          setReportKind('post');
                        }}
                        aria-label="Report"
                      >
                        <Flag size={16} />
                      </button>
                    </div>
                  </div>

                  {/* comments */}
                  {commentsOpen && (
                    <PostCommentsSection
                      postId={post.id}
                      currentUser={currentUser}
                      onReport={(commentId) => {
                        setReportKind('comment');
                        setReportTargetId(commentId);
                      }}
                      isQuestion={post.kind === 'QUESTION'}
                      answeredCommentId={post.answeredCommentId}
                      canMarkAnswer={canMarkAnswer(post)}
                      onToggleAnswer={(commentId) => handleToggleAnswer(post, commentId)}
                      onTagClick={applyHashtag}
                    />
                  )}
                </article>
              );
            })}
          </div>

          {/* End-cap only once the list has actually loaded — otherwise
              "You're all caught up." flashes during the cold fetch. */}
          {!feedLoading && (
            <div className="cf__end">
              {viewMode === 'saved'
                ? filteredPosts.length
                  ? "That's all your saved posts."
                  : "You haven't saved any posts yet. Tap the bookmark icon on a post to keep it here."
                : "You're all caught up. Check back for more from the team."}
            </div>
          )}
        </main>

        {/* ═══ RIGHT RAIL ═══════════════════════════════════════════ */}
        <aside className="cf__rail">
          <div className="cf__rail-inner">

          {/* ─── Upcoming sessions (student only) ─── */}
          {showUpcomingSessions && (
            <section className="cf__widget cf__sessions-widget">
              <div className="cf__widget-head">
                <Calendar size={13} /> {t('studentHub.feed.upcomingSessionsTitle', 'UPCOMING SESSIONS')}
              </div>
              {upcomingSessions.length === 0 ? (
                <div className="cf__sessions-empty">
                  <p>{t('studentHub.feed.noUpcomingSessions', 'No upcoming sessions.')}</p>
                  <button
                    type="button"
                    className="cf__sessions-book"
                    onClick={() => navigate('/mentors')}
                  >
                    {t('studentHub.feed.bookAMentor', 'Book a mentor')}
                  </button>
                </div>
              ) : (
                <ul className="cf__sessions-list">
                  {upcomingSessions.slice(0, 3).map((s) => {
                    const date = dayjs(s.date);
                    return (
                      <li key={s.id} className="cf__session-item">
                        <div
                          className="cf__session-main"
                          role="button"
                          tabIndex={0}
                          onClick={() => s.mentorId && navigate(`/mentors/${s.mentorId}`)}
                          onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && s.mentorId) {
                              navigate(`/mentors/${s.mentorId}`);
                            }
                          }}
                        >
                          <div className="cf__session-mentor">{s.mentor}</div>
                          <div className="cf__session-meta">
                            {date.format('MMM D, h:mm A')} ·{' '}
                            {t('studentHub.feed.minSession', '{{min}} min session', {
                              min: s.durationMin,
                            })}
                          </div>
                        </div>
                        {s.meetingLink ? (
                          <a
                            className="cf__session-join"
                            href={s.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t('studentHub.feed.joinSession', 'Join')}
                            <ArrowUpRight size={11} />
                          </a>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
              <button
                type="button"
                className="cf__sessions-viewall"
                onClick={() => navigate('/student-hub?section=my-learning')}
              >
                {t('studentHub.feed.viewAllSessions', 'View all')}
                <ArrowUpRight size={11} />
              </button>
            </section>
          )}

          {/* ─── Trending this week ─── */}
          {trending.length > 0 && (
            <section className="cf__widget">
              <div className="cf__widget-head">
                <TrendingUp size={13} /> Trending this week
              </div>
              <ul className="cf__trending">
                {trending.map((post, i) => (
                  <li
                    key={post.id}
                    className="cf__trending-item"
                    onClick={() => navigate(`/community/post/${post.id}`)}
                  >
                    <span className="cf__trending-rank">{i + 1}</span>
                    <div className="cf__trending-main">
                      <div className="cf__trending-body">
                        {post.body.replace(/\n+/g, ' ').slice(0, 80)}
                        {post.body.length > 80 ? '…' : ''}
                      </div>
                      <div className="cf__trending-meta">
                        <span>{post.authorName}</span>
                        <span className="cf__trending-dot">·</span>
                        <span>
                          <Heart size={9} /> {post.likeCount}
                        </span>
                        <span>
                          <MessageSquare size={9} /> {post.commentCount}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ─── Trending hashtags ─── */}
          {trendingTags.length > 0 && (
            <section className="cf__widget">
              <div className="cf__widget-head">
                <Hash size={13} /> TRENDING TAGS
              </div>
              <ul className="cf__tag-cloud">
                {trendingTags.map((t) => (
                  <li key={t.tag}>
                    <button
                      type="button"
                      className={`cf__tag-pill ${activeHashtag === t.tag ? 'cf__tag-pill--on' : ''}`}
                      onClick={() => applyHashtag(t.tag)}
                    >
                      #{t.tag}
                      <span className="cf__tag-pill-count">{t.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ─── Top mentors (rotated weekly) ─── */}
          {topMentors.length > 0 && (
            <section className="cf__widget">
              <div className="cf__widget-head">
                <GraduationCap size={13} /> Top mentors · This week
              </div>
              <ul className="cf__mentors">
                {topMentors.map((m) => (
                  <li
                    key={m.userId}
                    className="cf__mentor-card"
                    onClick={() => navigate(`/mentors/${m.userId}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') navigate(`/mentors/${m.userId}`);
                    }}
                  >
                    {m.avatarUrl ? (
                      <img
                        className="cf__mentor-avatar"
                        src={resolveMediaUrl(m.avatarUrl)}
                        alt={m.name}
                      />
                    ) : (
                      <div
                        className="cf__avatar cf__avatar--md"
                        style={{ background: colorForId(m.userId) }}
                        aria-hidden
                      >
                        {initialsFromName(m.name)}
                      </div>
                    )}
                    <div className="cf__mentor-main">
                      <div className="cf__mentor-name">{m.name}</div>
                      <div className="cf__mentor-sub">
                        {/* Academic identity first — that's what students judge a coach on. */}
                        {[m.major, m.university].filter(Boolean).join(' · ') ||
                          m.title ||
                          'Mentor'}
                      </div>
                      {Number(m.rating) > 0 && (
                        <div className="cf__mentor-rating">
                          <Star size={10} fill="currentColor" /> {Number(m.rating).toFixed(1)}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ─── Top contributors (helpful replies) ─── */}
          <section className="cf__widget">
            <div className="cf__widget-head">Top contributors · This month</div>
            <ul className="cf__leaderboard">
              {leaderboard.length === 0 && (
                <li className="cf__leader-empty">No helpful replies yet this month.</li>
              )}
              {leaderboard.map((u, i) => (
                <li key={u.id} className="cf__leader">
                  <span className="cf__leader-rank">{i + 1}</span>
                  <div
                    className="cf__avatar cf__avatar--sm"
                    style={{ background: colorForId(u.id) }}
                    aria-hidden
                  >
                    {initialsFromName(u.name)}
                  </div>
                  <div className="cf__leader-main">
                    <div className="cf__leader-name">
                      {u.name.length > 14 ? `${u.name.slice(0, 14)}…` : u.name}
                    </div>
                    <div className="cf__leader-meta">{u.helpfulReplies} helpful replies</div>
                  </div>
                  <div className="cf__leader-coins">
                    <Coins size={11} /> {compactNumber(u.totalLikes)}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* ─── House Rules (dismissable) ─── */}
          {!houseRulesDismissed && (
            <section className="cf__widget cf__rules-widget">
              <div className="cf__widget-head cf__widget-head--row">
                <span>House rules</span>
                <button
                  type="button"
                  className="cf__widget-dismiss"
                  onClick={dismissHouseRules}
                  aria-label="Dismiss house rules"
                  title="Dismiss"
                >
                  <X size={12} />
                </button>
              </div>
              <ol className="cf__rules">
                {HOUSE_RULES.map((rule, i) => (
                  <li key={rule}>
                    <span className="cf__rule-num">{String(i + 1).padStart(2, '0')}</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          </div>
        </aside>
      </div>

      {reportTargetId && <CommunityReportDialog
        key={`${reportKind}:${reportTargetId}`}
        target={{ id: reportTargetId, kind: reportKind }}
        onClose={() => { setReportTargetId(null); setReportKind('post'); }}
        onSuccess={() => message.success('Your report has been sent to our moderation team.')}
      />}
      {composerCopiedToast && <div className="cf__toast">{composerCopiedToast}</div>}
    </div>
    </ApplicantPage>
  );
};

/* ─── sub-components ────────────────────────────────────────── */

export const PostCommentsSection: React.FC<{
  postId: string;
  currentUser: Props['currentUser'];
  onReport: (commentId: string) => void;
  isQuestion: boolean;
  answeredCommentId: string | null;
  canMarkAnswer: boolean;
  onToggleAnswer: (commentId: string) => void;
  onTagClick: (tag: string) => void;
}> = ({
  postId,
  currentUser,
  onReport,
  isQuestion,
  answeredCommentId,
  canMarkAnswer,
  onToggleAnswer,
  onTagClick,
}) => {
  const { data, isLoading, isError, refetch } = useListCommentsQuery(postId);
  const [createComment, { isLoading: isPosting }] = useCreateCommentMutation();
  const [toggleCommentLike] = useToggleCommentLikeMutation();
  const [draft, setDraft] = useState('');
  /**
   * Track which top-level comment has its reply box open, plus its draft.
   * Only one reply box at a time keeps the UI calm and matches LinkedIn.
   */
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');

  const comments: Comment[] = useMemo(() => {
    // Newest top-level comments first (backend returns createdAt ASC). Replies
    // stay chronological within their own thread — only the top level flips.
    const sorted = [...(data ?? [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const raw = sorted.map(toUiComment);
    if (!isQuestion || !answeredCommentId) return raw;
    // Pin the accepted answer to the top — Stack Overflow convention.
    // It still renders in its parent thread; we just promote the
    // top-level comment that holds it.
    const idx = raw.findIndex((c) => c.id === answeredCommentId);
    if (idx <= 0) return raw;
    const reordered = [raw[idx], ...raw.slice(0, idx), ...raw.slice(idx + 1)];
    return reordered;
  }, [data, isQuestion, answeredCommentId]);

  // Clear the input optimistically on send — waiting for the response left
  // the typed text sitting in the box whenever the request was slow or
  // errored after the comment was already persisted. On a real failure the
  // draft is restored so nothing the user typed is lost.
  const submit = () => {
    const text = draft.trim();
    if (!text || isPosting) return;
    setDraft('');
    createComment({ postId, body: { body: text } })
      .unwrap()
      .catch(() => { setDraft(text); message.error('Your comment was not sent. Please try again.'); });
  };

  const submitReply = (parentCommentId: string) => {
    const text = replyDraft.trim();
    if (!text || isPosting) return;
    setReplyDraft('');
    setReplyOpenId(null);
    createComment({ postId, body: { body: text, parentCommentId } })
      .unwrap()
      .catch(() => {
        setReplyDraft(text);
        setReplyOpenId(parentCommentId);
        message.error('Your reply was not sent. Please try again.');
      });
  };

  const onToggleLike = (commentId: string) => {
    void toggleCommentLike({ commentId, postId }).unwrap().catch(() => message.error('Could not update this like. Please try again.'));
  };

  const onOpenReply = (commentId: string) => {
    setReplyOpenId((cur) => (cur === commentId ? null : commentId));
    setReplyDraft('');
  };

  return (
    <div className="cf__comments">
      <div className="cf__comment-composer">
        {currentUser.avatarUrl ? (
          <img
            className="cf__avatar cf__avatar--sm cf__avatar-img"
            src={resolveMediaUrl(currentUser.avatarUrl)}
            alt={currentUser.name}
          />
        ) : (
          <div
            className="cf__avatar cf__avatar--sm"
            style={{ background: currentUser.avatarColor }}
            aria-hidden
          >
            {currentUser.initials}
          </div>
        )}
        <input
          className="cf__comment-input"
          aria-label="Add a comment"
          placeholder="Add a thoughtful comment…  (+2 coins)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          disabled={isPosting}
        />
        <button
          type="button"
          className="cf__comment-send"
          aria-label="Send"
          onClick={submit}
          disabled={!draft.trim() || isPosting}
        >
          <Send size={14} />
        </button>
      </div>
      {isLoading && (
        <div className="cf__comment-loading">Loading comments…</div>
      )}
      {isError && <div role="alert">Comments could not be loaded. <button type="button" onClick={() => refetch()}>Try again</button></div>}
      {!isLoading && !isError && comments.length === 0 && <p className="cf__comment-loading">No comments yet. Start the conversation.</p>}
      {comments.map((c) => (
        <CommentNode
          key={c.id}
          comment={c}
          currentUser={currentUser}
          onReport={onReport}
          onToggleLike={onToggleLike}
          replyOpenId={replyOpenId}
          replyDraft={replyDraft}
          onOpenReply={onOpenReply}
          onChangeReplyDraft={setReplyDraft}
          onSubmitReply={submitReply}
          isReplyPosting={isPosting}
          isQuestion={isQuestion}
          answeredCommentId={answeredCommentId}
          canMarkAnswer={canMarkAnswer}
          onToggleAnswer={onToggleAnswer}
          onTagClick={onTagClick}
        />
      ))}
    </div>
  );
};

const CommentNode: React.FC<{
  comment: Comment;
  currentUser: Props['currentUser'];
  onReport: (commentId: string) => void;
  onToggleLike: (commentId: string) => void;
  /** Reply state lives in the parent so only one box is open at a time. */
  replyOpenId: string | null;
  replyDraft: string;
  onOpenReply: (commentId: string) => void;
  onChangeReplyDraft: (next: string) => void;
  onSubmitReply: (parentCommentId: string) => void;
  isReplyPosting: boolean;
  isQuestion: boolean;
  answeredCommentId: string | null;
  canMarkAnswer: boolean;
  onToggleAnswer: (commentId: string) => void;
  onTagClick: (tag: string) => void;
  depth?: number;
}> = ({
  comment,
  currentUser,
  onReport,
  onToggleLike,
  replyOpenId,
  replyDraft,
  onOpenReply,
  onChangeReplyDraft,
  onSubmitReply,
  isReplyPosting,
  isQuestion,
  answeredCommentId,
  canMarkAnswer,
  onToggleAnswer,
  onTagClick,
  depth = 0,
}) => {
  const replyOpen = replyOpenId === comment.id;
  const isAnswer = isQuestion && answeredCommentId === comment.id;
  return (
    <div
      className={[
        'cf__comment',
        depth > 0 ? 'cf__comment--reply' : '',
        isAnswer ? 'cf__comment--answer' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {comment.author.avatarUrl ? (
        <img
          className="cf__avatar cf__avatar--sm cf__avatar-img"
          src={resolveMediaUrl(comment.author.avatarUrl)}
          alt={comment.author.name}
        />
      ) : (
        <div
          className="cf__avatar cf__avatar--sm"
          style={{ background: comment.author.avatarColor }}
          aria-hidden
        >
          {comment.author.initials}
        </div>
      )}
      <div className="cf__comment-main">
        <div className="cf__comment-bubble">
          <div className="cf__comment-head">
            <span className="cf__comment-author">{comment.author.name}</span>
            <span className="cf__comment-time">· {comment.timeAgo}</span>
            {isAnswer && (
              <span className="cf__comment-answer-tag">
                <CheckCheck size={10} /> Accepted answer
              </span>
            )}
          </div>
          <div className="cf__comment-body">
            {renderMentionableLine(comment.body, `c-${comment.id}`, onTagClick)}
          </div>
        </div>
        <div className="cf__comment-actions">
          <button
            type="button"
            className={`cf__comment-action ${comment.likedByMe ? 'cf__comment-action--on' : ''}`}
            onClick={() => onToggleLike(comment.id)}
            aria-pressed={comment.likedByMe}
          >
            <Heart size={11} fill={comment.likedByMe ? 'currentColor' : 'none'} />{' '}
            {comment.likes}
          </button>
          {depth === 0 && (
            <button
              type="button"
              className={`cf__comment-action ${replyOpen ? 'cf__comment-action--on' : ''}`}
              onClick={() => onOpenReply(comment.id)}
            >
              <MessageCircle size={11} /> Reply
            </button>
          )}
          <button type="button" className="cf__comment-action" onClick={() => onReport(comment.id)}>
            <Flag size={11} /> Report
          </button>
          {isQuestion && canMarkAnswer && depth === 0 && (
            <button
              type="button"
              className={`cf__comment-action ${isAnswer ? 'cf__comment-action--on' : ''}`}
              onClick={() => onToggleAnswer(comment.id)}
              title={isAnswer ? 'Unmark as answer' : 'Mark as the accepted answer'}
            >
              <Check size={11} /> {isAnswer ? 'Answer accepted' : 'Mark as answer'}
            </button>
          )}
        </div>

        {/* Inline reply box — only on top-level comments (depth=0).
            Backend enforces the depth-1 cap; we hide the Reply button on
            replies so we never even ask. */}
        {depth === 0 && replyOpen && (
          <div className="cf__comment-reply-box">
            {currentUser.avatarUrl ? (
              <img
                className="cf__avatar cf__avatar--sm cf__avatar-img"
                src={resolveMediaUrl(currentUser.avatarUrl)}
                alt={currentUser.name}
              />
            ) : (
              <div
                className="cf__avatar cf__avatar--sm"
                style={{ background: currentUser.avatarColor }}
                aria-hidden
              >
                {currentUser.initials}
              </div>
            )}
            <input
              className="cf__comment-input"
              placeholder={`Reply to ${comment.author.name.split(' ')[0]}…`}
              value={replyDraft}
              onChange={(e) => onChangeReplyDraft(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSubmitReply(comment.id);
                } else if (e.key === 'Escape') {
                  onOpenReply(comment.id); // toggle closes
                }
              }}
              disabled={isReplyPosting}
            />
            <button
              type="button"
              className="cf__comment-send"
              aria-label="Send reply"
              onClick={() => onSubmitReply(comment.id)}
              disabled={!replyDraft.trim() || isReplyPosting}
            >
              <Send size={14} />
            </button>
          </div>
        )}

        {comment.replies?.map((r) => (
          <CommentNode
            key={r.id}
            comment={r}
            currentUser={currentUser}
            onReport={onReport}
            onToggleLike={onToggleLike}
            replyOpenId={replyOpenId}
            replyDraft={replyDraft}
            onOpenReply={onOpenReply}
            onChangeReplyDraft={onChangeReplyDraft}
            onSubmitReply={onSubmitReply}
            isReplyPosting={isReplyPosting}
            isQuestion={isQuestion}
            answeredCommentId={answeredCommentId}
            canMarkAnswer={canMarkAnswer}
            onToggleAnswer={onToggleAnswer}
            onTagClick={onTagClick}
            depth={depth + 1}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Single poll attached to a post. Two visual modes:
 *   - Pre-vote: each option is a clickable button. No counts shown so
 *     the viewer isn't anchored by current results.
 *   - Post-vote / closed: each option becomes a labeled bar with a
 *     percentage and a vote count. The viewer's pick is highlighted.
 */
export const PollCard: React.FC<{
  poll: CommunityPoll;
  isAuthor: boolean;
  onVote: (optionId: string) => void;
  onClose: () => void;
}> = ({ poll, isAuthor, onVote, onClose }) => {
  const hasVoted = !!poll.myVoteOptionId;
  const showResults = hasVoted || poll.isClosed;
  const total = Math.max(poll.totalVotes, 1); // avoid /0 — % shows 0% pre-vote

  return (
    <div className={`cf__poll ${poll.isClosed ? 'cf__poll--closed' : ''}`}>
      <div className="cf__poll-head">
        <span className="cf__poll-tag">
          <BarChart3 size={11} /> POLL
        </span>
        {poll.question && <span className="cf__poll-question">{poll.question}</span>}
        {poll.isClosed && (
          <span className="cf__poll-closed-tag">
            <Lock size={10} /> Closed
          </span>
        )}
      </div>

      <div className="cf__poll-options" role={showResults ? 'list' : 'radiogroup'}>
        {poll.options.map((opt) => {
          const pct = showResults ? Math.round((opt.voteCount / total) * 100) : 0;
          const isMine = poll.myVoteOptionId === opt.id;
          if (showResults) {
            return (
              <div
                key={opt.id}
                className={`cf__poll-result ${isMine ? 'cf__poll-result--mine' : ''}`}
                role="listitem"
              >
                <div className="cf__poll-result-bar" style={{ width: `${pct}%` }} />
                <span className="cf__poll-result-label">{opt.label}</span>
                <span className="cf__poll-result-meta">
                  {pct}% <span className="cf__poll-result-count">· {opt.voteCount}</span>
                </span>
              </div>
            );
          }
          return (
            <button
              key={opt.id}
              type="button"
              className="cf__poll-vote-btn"
              role="radio"
              aria-checked={false}
              onClick={() => onVote(opt.id)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="cf__poll-footer">
        <span className="cf__poll-total">
          {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
        </span>
        {isAuthor && !poll.isClosed && (
          <button type="button" className="cf__poll-close-btn" onClick={onClose}>
            <Lock size={11} /> Close poll
          </button>
        )}
      </div>
    </div>
  );
};

export default CommunityFeedEditorialView;
