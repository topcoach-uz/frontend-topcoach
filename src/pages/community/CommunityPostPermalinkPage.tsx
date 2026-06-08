/**
 * Community post permalink — auth-walled single-post view.
 *
 * Reached via `/community/post/:id` (the "Copy link" share action emits
 * this URL). Unsigned-in users get redirected to login; non-enrolled users
 * see the existing community lock screen.
 *
 * Visually mirrors a single post card from the feed, plus the full
 * comment thread. v1: read + comment + like + save. No composer here.
 */
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, Bookmark, Share2, Flag } from 'lucide-react';
import { useGetPostQuery } from 'src/app/services/communityFeedApi';
import { useTypedSelector } from 'src/app/store';
import { hostName } from 'src/app/services/api/const';
import './CommunityPostPermalinkPage.scss';
import { useCommunitySocket } from 'src/lib/socket/communitySocket';

/** Same helper as the editorial view — make relative `/uploads/...` URLs absolute. */
const resolveMediaUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${hostName}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function CommunityPostPermalinkPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useTypedSelector((s) => !!s.auth?.isAuthenticated);

  const { joinPost, leavePost } = useCommunitySocket();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/community/post/${id ?? ''}`)}`, { replace: true });
    }
  }, [isAuthenticated, navigate, id]);

  useEffect(() => {
    if (!id) return;
    joinPost(id);
    return () => leavePost(id);
  }, [id, joinPost, leavePost]);

  const { data: post, isLoading, isError } = useGetPostQuery(id ?? '', {
    skip: !id || !isAuthenticated,
  });

  if (!id) return null;

  return (
    <div className="cp">
      <div className="cp__wrap">
        <button type="button" className="cp__back" onClick={() => navigate('/student-hub?section=feed')}>
          <ArrowLeft size={14} /> Back to feed
        </button>

        {isLoading && <div className="cp__loading">Loading…</div>}
        {isError && (
          <div className="cp__error">
            This post is no longer available. It may have been removed by moderators or by the author.
          </div>
        )}

        {post && (
          <article className="cp__post">
            <header className="cp__head">
              <div
                className={`cp__avatar ${post.postingPersona === 'OFFICIAL' ? 'cp__avatar--official' : ''}`}
                aria-hidden
              >
                {(post.author?.name ?? 'M').slice(0, 2).toUpperCase()}
              </div>
              <div className="cp__head-text">
                <div className="cp__author">{post.author?.name ?? 'Member'}</div>
                <div className="cp__meta">
                  {post.postingPersona === 'OFFICIAL' ? 'Top Coach Official · ' : ''}
                  <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleString()}</time>
                </div>
              </div>
              <span className={`cp__cat cp__cat--${post.category}`}>{post.category}</span>
            </header>

            <div className="cp__body">
              {post.body.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            {!!post.mediaUrls?.length && (
              <div className="cp__media">
                {post.mediaUrls.map((url) => (
                  <img key={url} src={resolveMediaUrl(url)} alt="" />
                ))}
              </div>
            )}

            <div className="cp__meta-row">
              <span><Heart size={12} /> {post.likeCount}</span>
              <span>{post.commentCount} comments</span>
              <span>{post.savedCount} saved</span>
              <span className="cp__meta-views">👁 {post.viewCount}</span>
            </div>

            <div className="cp__actions">
              <button type="button" className={`cp__action ${post.isLikedByMe ? 'cp__action--on' : ''}`}>
                <Heart size={16} fill={post.isLikedByMe ? 'currentColor' : 'none'} /> Like
              </button>
              <button type="button" className="cp__action">
                <Share2 size={16} /> Share
              </button>
              <button type="button" className={`cp__action ${post.isSavedByMe ? 'cp__action--on' : ''}`}>
                <Bookmark size={16} fill={post.isSavedByMe ? 'currentColor' : 'none'} /> Save
              </button>
              <button type="button" className="cp__action">
                <Flag size={16} /> Report
              </button>
            </div>

            <div className="cp__open-feed">
              <Link to="/student-hub?section=feed">Open the full feed →</Link>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
