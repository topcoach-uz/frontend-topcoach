import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Share2,
  Flag,
  MessageSquare,
} from "lucide-react";
import { message } from "antd";
import {
  useGetPostQuery,
  useTogglePostLikeMutation,
  useTogglePostSaveMutation,
  useMarkAnswerMutation,
  useUnmarkAnswerMutation,
  useVotePollMutation,
  useClosePollMutation,
} from "src/app/services/communityFeedApi";
import { useTypedSelector } from "src/app/store";
import { hostName } from "src/app/services/api/const";
import { useCommunitySocket } from "src/lib/socket/communitySocket";
import { displayName } from "src/utils/displayName";
import { getLatestCreatedImg } from "src/utils";
import {
  PostCommentsSection,
  PollCard,
  renderBody,
} from "../student-hub/community/CommunityFeedEditorialView";
import CommunityReportDialog, {
  type ReportTarget,
} from "./CommunityReportDialog";
import "./CommunityPostPermalinkPage.scss";

const resolveMediaUrl = (url: string) =>
  /^https?:\/\//i.test(url)
    ? url
    : `${hostName}${url.startsWith("/") ? "" : "/"}${url}`;

export default function CommunityPostPermalinkPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useTypedSelector((s) => s.auth);
  const { joinPost, leavePost } = useCommunitySocket();
  const {
    currentData: post,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetPostQuery(id, { skip: !id || !isAuthenticated });
  const [like, likeState] = useTogglePostLikeMutation();
  const [save, saveState] = useTogglePostSaveMutation();
  const [markAnswer] = useMarkAnswerMutation();
  const [unmarkAnswer] = useUnmarkAnswerMutation();
  const [vote, voteState] = useVotePollMutation();
  const [closePoll] = useClosePollMutation();
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const name = displayName(profile?.profile?.name, profile?.email, "Member");
  const staff = ["SuperAdmin", "Admin", "Owner"].includes(
    profile?.managementRole ?? "",
  );
  const currentUser = {
    id: profile?.id ?? "",
    name,
    initials: name
      .split(" ")
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase(),
    avatarColor: "#7b1f2f",
    avatarUrl: getLatestCreatedImg(profile?.profile?.media || []),
    canPost: staff,
    canPin: profile?.managementRole === "SuperAdmin",
  };
  useEffect(() => {
    if (!isAuthenticated)
      navigate(
        `/auth/signin?redirect=${encodeURIComponent(`/community/post/${id}`)}`,
        { replace: true },
      );
  }, [isAuthenticated, navigate, id]);
  const accessiblePostId = !error ? post?.id : undefined;
  useEffect(() => {
    if (!accessiblePostId || !isAuthenticated) return;
    joinPost(accessiblePostId);
    return () => leavePost(accessiblePostId);
  }, [accessiblePostId, isAuthenticated, joinPost, leavePost]);

  const run = async (action: Promise<unknown>) => {
    try {
      await action;
    } catch {
      message.error("That action could not be completed. Please try again.");
    }
  };
  const share = async () => {
    const url = `${window.location.origin}/community/post/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      message.success("Post link copied.");
    } catch {
      setShareUrl(url);
    }
  };
  const status = error && "status" in error ? error.status : undefined;
  if (!isAuthenticated || !id) return null;

  return (
    <div className="cp">
      <div className="cp__wrap">
        <Link className="cp__back" to="/student-hub?section=feed">
          <ArrowLeft size={14} /> Back to Community
        </Link>
        <div className="cp__layout">
          <main className="cp__main">
            {(isLoading || (!post && isFetching)) && (
              <div className="cp__loading" role="status">
                Loading post…
              </div>
            )}
            {error && (
              <div className="cp__error" role="alert">
                <h1>
                  {status === 403
                    ? "Community access required"
                    : status === 404
                      ? "Post unavailable"
                      : "Unable to load this post"}
                </h1>
                <p>
                  {status === 403
                    ? "Your account does not currently have access to this post."
                    : status === 404
                      ? "This post may have been removed or is no longer available."
                      : "Please try again. Your connection may have been interrupted."}
                </p>
                {status === 403 ? (
                  <Link to="/student-hub?section=feed">
                    View Community access →
                  </Link>
                ) : (
                  status !== 404 && (
                    <button
                      className="cp__action"
                      onClick={() => refetch()}
                      disabled={isFetching}
                    >
                      Try again
                    </button>
                  )
                )}
              </div>
            )}
            {post && !error && (
              <>
                <div className="cp__context">
                  <span className="cp__cat">
                    {post.category.replace(/_/g, " ")}
                  </span>
                  <span>Shared community post</span>
                </div>
                <article className="cp__post">
                  <header className="cp__head">
                    {post.author?.avatarUrl ? (
                      <img
                        className="cp__avatar"
                        src={resolveMediaUrl(post.author.avatarUrl)}
                        alt=""
                      />
                    ) : (
                      <div className="cp__avatar" aria-hidden>
                        {(post.author?.name ?? "Member")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="cp__author">
                        {post.author?.name ?? "Member"}
                      </div>
                      <div className="cp__meta">
                        {post.postingPersona === "OFFICIAL" &&
                          "TopCoach Official · "}
                        <time dateTime={post.createdAt}>
                          {new Date(post.createdAt).toLocaleString()}
                        </time>
                      </div>
                    </div>
                  </header>
                  <div className="cp__body">{renderBody(post.body)}</div>
                  {!!post.mediaUrls?.length && (
                    <div className="cp__media">
                      {post.mediaUrls.map((url) => (
                        <img
                          key={url}
                          src={resolveMediaUrl(url)}
                          alt="Post attachment"
                        />
                      ))}
                    </div>
                  )}
                  {post.poll && (
                    <PollCard
                      poll={post.poll}
                      isAuthor={post.authorId === currentUser.id || staff}
                      onVote={(optionId) => {
                        if (!voteState.isLoading)
                          void run(
                            vote({
                              pollId: post.poll!.id,
                              postId: id,
                              optionId,
                            })
                              .unwrap()
                              .then(() => refetch()),
                          );
                      }}
                      onClose={() =>
                        void run(
                          closePoll({
                            pollId: post.poll!.id,
                            postId: id,
                          }).unwrap(),
                        )
                      }
                    />
                  )}
                  <div className="cp__meta-row">
                    <span>
                      <Heart size={12} /> {post.likeCount}
                    </span>
                    <span>{post.commentCount} comments</span>
                    <span>{post.savedCount} saved</span>
                  </div>
                  <div className="cp__actions">
                    <button
                      className={`cp__action ${post.isLikedByMe ? "cp__action--on" : ""}`}
                      aria-pressed={!!post.isLikedByMe}
                      disabled={likeState.isLoading || isFetching}
                      onClick={() => void run(like(id).unwrap())}
                    >
                      <Heart
                        size={16}
                        fill={post.isLikedByMe ? "currentColor" : "none"}
                      />{" "}
                      Like
                    </button>
                    <a className="cp__action" href="#discussion">
                      <MessageSquare size={16} /> Comment
                    </a>
                    <button className="cp__action" onClick={share}>
                      <Share2 size={16} /> Share
                    </button>
                    <button
                      className={`cp__action ${post.isSavedByMe ? "cp__action--on" : ""}`}
                      aria-pressed={!!post.isSavedByMe}
                      disabled={saveState.isLoading || isFetching}
                      onClick={() => void run(save(id).unwrap())}
                    >
                      <Bookmark
                        size={16}
                        fill={post.isSavedByMe ? "currentColor" : "none"}
                      />{" "}
                      Save
                    </button>
                    <button
                      className="cp__action"
                      onClick={() => setReportTarget({ id, kind: "post" })}
                    >
                      <Flag size={16} /> Report
                    </button>
                  </div>
                  {shareUrl && (
                    <label className="cp__share-link">
                      Copy this link
                      <input
                        readOnly
                        value={shareUrl}
                        onFocus={(e) => e.target.select()}
                      />
                    </label>
                  )}
                </article>
                <section
                  id="discussion"
                  className="cp__discussion"
                  aria-labelledby="discussion-title"
                >
                  <div className="cp__discussion-head">
                    <h2 id="discussion-title">Discussion</h2>
                    <span>{post.commentCount} comments · Newest first</span>
                  </div>
                  <PostCommentsSection
                    key={id}
                    postId={id}
                    currentUser={currentUser}
                    onReport={(commentId) =>
                      setReportTarget({ id: commentId, kind: "comment" })
                    }
                    isQuestion={post.postKind === "QUESTION"}
                    answeredCommentId={post.answeredCommentId ?? null}
                    canMarkAnswer={staff || post.authorId === currentUser.id}
                    onToggleAnswer={(commentId) =>
                      void run(
                        post.answeredCommentId === commentId
                          ? unmarkAnswer({ postId: id }).unwrap()
                          : markAnswer({ postId: id, commentId }).unwrap(),
                      )
                    }
                    onTagClick={() => navigate("/student-hub?section=feed")}
                  />
                </section>
              </>
            )}
          </main>
          <aside className="cp__rail" aria-label="Community information">
            <section>
              <h2>Keep the conversation going</h2>
              <p>Explore questions, advice, and progress from the Community.</p>
              <Link to="/student-hub?section=feed">Open Community Feed →</Link>
            </section>
            <section>
              <h2>A useful, safe community</h2>
              <p>
                Be specific. Be kind. Protect privacy. Report concerns using the
                flag on a post or comment.
              </p>
            </section>
          </aside>
        </div>
      </div>
      {reportTarget && (
        <CommunityReportDialog
          key={`${reportTarget.kind}:${reportTarget.id}`}
          target={reportTarget}
          onClose={() => setReportTarget(null)}
          onSuccess={() =>
            message.success("Your report has been sent to our moderation team.")
          }
        />
      )}
    </div>
  );
}
