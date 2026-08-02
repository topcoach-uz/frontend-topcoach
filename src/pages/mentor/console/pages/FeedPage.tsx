import CommunityFeedEditorialView from 'src/pages/student-hub/community/CommunityFeedEditorialView';
import { useMentorConsole } from '../MentorConsoleContext';
import { initialsFromName } from '../utils';

/**
 * Read-only community Feed inside the mentor console.
 *
 * Mentors can browse the feed and interact (like / comment / save) but not
 * create posts — `canPost` / `canPin` are hard-false here, and the backend
 * still gates post creation to staff in CommunityFeedService. Access to the
 * feed itself is granted to mentors by CommunityEnrollmentGuard.
 */
export default function MentorConsoleFeedPage() {
  const { id, displayName, avatarUrl } = useMentorConsole();

  return (
    <div>
      <div className="mc-page-head mc-page-head--ruled">
        <div className="mc-page-eyebrow">
          Mentor <span className="mc-page-eyebrow-accent">· Community</span>
        </div>
        <h1 className="mc-page-title">Feed</h1>
        <p className="mc-page-lead">
          See what students are talking about across the community. You can like, comment, and
          save posts — posting is reserved for the TopCoach team.
        </p>
      </div>

      <CommunityFeedEditorialView
        currentUser={{
          id: id ?? '',
          name: displayName,
          initials: initialsFromName(displayName),
          avatarColor: '#7B1F2F',
          avatarUrl: avatarUrl ?? null,
          canPost: false,
          canPin: false,
        }}
        // Mentors don't have their own `joinedSessions` as a student, so
        // the student-only "Upcoming sessions" rail widget stays hidden
        // here (this component is shared with the student-hub feed).
        showUpcomingSessions={false}
      />
    </div>
  );
}
