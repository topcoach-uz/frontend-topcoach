import { lazy, Suspense, useEffect } from "react";
import {
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
  Navigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useTypedSelector } from "src/app/store";
import { useGetMeQuery } from "src/app/services/users";
import { useGetMyOrgsQuery } from "src/app/services/counselorConsoleApi";
import { useGetUserPreferencesQuery } from "src/app/services/student-hub/dashboardApi";
import { useGetCurrentSubscriptionQuery } from "src/app/services/subscription";
import { useListPostsQuery } from "src/app/services/communityFeedApi";

// Stable args for the feed prefetch — must serialize identically to the
// feed view's default query ({category/hashtag/q: undefined} ≡ {}) so both
// share one cache entry.
const FEED_DEFAULT_ARGS = {};
import HomeRouter from "src/pages/home/HomeRouter";
import { ISC_2026_ENABLED } from "src/lib/iscAccess";
import { UserRole } from "src/app/api/Api";

// Layouts
import MainLayout from "src/components/layouts/main";
import RootLayout from "src/components/layouts/root";
import Loader from "src/components/loader";
import SetNewPasswordPage from "src/pages/auth/forgot-password/set-new-password";
import { CustomRouter } from "./CustomRouter";
import customHistory from "../history";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "src/components/ErrorFallback";
import { GlobalModals } from "src/components/GlobalModals";
import AdminConsoleGate from "src/pages/admin/console/AdminConsoleGate";
import MentorConsoleGate from "src/pages/mentor/console/MentorConsoleGate";
import CounselorConsoleGate from "src/pages/counselor-console/CounselorConsoleGate";
import NavigationProgressBar from "src/components/NavigationProgressBar";
import PostHogPageView from "src/lib/posthog/PostHogPageView";

// Pages

const HomePage = lazy(() => import("src/pages/home"));
// HomeRouter is a tiny routing-decision component imported directly (not
// lazy) so the post-login redirect doesn't flash an extra Suspense loader.
const HelpPageLazy = lazy(() => import("src/pages/help"));
const Custom404PageLazy = lazy(() => import("src/pages/404"));
const SuccessStoriesPageLazy = lazy(
  () => import("src/pages/success-stories")
);
const ContactFormPageLazy = lazy(() => import("src/pages/contact-form"));
const SuccessStoriesDetailPageLazy = lazy(
  () => import("src/pages/success-stories/detail")
);
const ContactPageLazy = lazy(() => import("src/pages/contact"));
const EventsPageLazy = lazy(() => import("src/pages/events"));
const Isc2026PreviewLazy = lazy(() => import("src/pages/isc-2026-preview"));
const Isc2026ApplicantLazy = lazy(() => import("src/pages/isc-2026-preview/ApplicantSite"));
const Isc2026ConsoleLazy = lazy(() => import("src/pages/isc-2026-preview/Console"));
const Isc2026ReviewerGateLazy = lazy(() => import("src/pages/isc-2026-preview/ReviewerGate"));
const CentralAsianAdmissionsForumPageLazy = lazy(
  () => import("src/pages/events/central-asian-admissions-forum")
);
const TopcoachLaunchEventPageLazy = lazy(
  () => import("src/pages/events/topcoach-launch-event")
);
/**
 * The placement-test funnel pages are mounted as internal sections of
 * `CommunityHubMockPage` at `/student-hub?section=placement-*` so they
 * inherit the COMMUNITY/LEARNING/ACCOUNT sidebar. The old top-level
 * URLs below redirect to those new section URLs for backwards
 * compatibility — bookmarks and shared links keep working.
 */
function PlacementProfileRedirect() {
  const { step } = useParams<{ step?: string }>();
  const target = step
    ? `/student-hub?section=placement-profile&step=${encodeURIComponent(step)}`
    : '/student-hub?section=placement-profile';
  return <Navigate to={target} replace />;
}
const EventDetailsPageLazy = lazy(
  () => import("src/pages/events/detail")
);
const ApplyToEventUndergraduatePageLazy = lazy(
  () => import("src/pages/events/detail/apply/undergraduate")
);
const ApplyToEventGraduatePage = lazy(
  () => import("src/pages/events/detail/apply/graduate")
);
const FaqPageLazy = lazy(() => import("src/pages/faq"));
const MentorsPageLazy = lazy(() => import("src/pages/mentors"));
const MentorDetailsPageLazy = lazy(
  () => import("src/pages/mentors/details")
);
const UniversitiesPageLazy = lazy(
  () => import("src/pages/universities")
);
const UniversityDetailPageLazy = lazy(
  () => import("src/pages/universities/detail")
);
const LandingPageLazy = lazy(() => import("src/pages/landing"));
const AuthLayoutLazy = lazy(
  () => import("src/components/layouts/auth")
);
const SignInPageLazy = lazy(() => import("src/pages/auth/signin"));
const SignUpPageLazy = lazy(() => import("src/pages/auth/signup"));
const MentorRegistrationPageLazy = lazy(
  () => import("src/pages/auth/signup/mentor")
);
const StudentRegistrationPageLazy = lazy(
  () => import("src/pages/auth/signup/student")
);
const GoogleAuthenticationPageLazy = lazy(
  () => import("src/pages/auth/google")
);
const ForgotPageLazy = lazy(
  () => import("src/pages/auth/forgot-password")
);
const VerificationPageLazy = lazy(
  () => import("src/pages/auth/verification")
);
const EmailSentPageLazy = lazy(
  () => import("src/pages/auth/forgot-password/sent")
);
const PrivacyPolicyPageLazy = lazy(
  () => import("src/pages/privacy-policy")
);
const TermsAndConditionsPageLazy = lazy(
  () => import("src/pages/terms-and-conditions")
);
const PaymentPageLazy = lazy(() => import("src/pages/payment"));
const PaymentSmsPageLazy = lazy(
  () => import("src/pages/payment/sms")
);
const ProgramsPageLazy = lazy(() => import("src/pages/programs"));
const ProgramsFullSupportPageLazy = lazy(() => import("src/pages/programs/IntensiveMentorshipProgram"));
const ProgramsAdmissionsPageLazy = lazy(() => import("src/pages/programs/admissions"));
const ProgramsAdmissionsMentorshipPageLazy = lazy(() => import("src/pages/programs/admissions-mentorship"));
const ProgramsSatPageLazy = lazy(() => import("src/pages/programs/sat"));
const ProgramsResearchPageLazy = lazy(() => import("src/pages/programs/research"));
const ProgramsSuccessPageLazy = lazy(() => import("src/pages/programs/success"));
const LearningPageLazy = lazy(() => import("src/pages/learning"));
const CourseManagementAdminLazy = lazy(() => import("src/pages/admin/courses/modules"));
const MentorConsoleLayoutLazy = lazy(() => import("src/pages/mentor/console/MentorConsoleLayout"));
const MentorConsoleScheduleLazy = lazy(() => import("src/pages/mentor/console/pages/SchedulePage"));
const MentorConsoleStudentsLazy = lazy(() => import("src/pages/mentor/console/pages/StudentsPage"));
const MentorStudentWorkspaceLazy = lazy(() => import("src/pages/mentor/console/pages/StudentWorkspacePage"));
const MentorConsoleAvailabilityLazy = lazy(() => import("src/pages/mentor/console/pages/AvailabilityPage"));
const MentorConsoleFeedLazy = lazy(() => import("src/pages/mentor/console/pages/FeedPage"));
const MentorConsoleProfileLazy = lazy(() => import("src/pages/mentor/console/pages/ProfilePage"));
const MentorResearchPrepLearnerLazy = lazy(
  () => import("src/pages/mentor/console/pages/ResearchPrepLearnerPage"),
);
const AdminNavLazy = lazy(() => import("src/components/common/AdminNav"));
const AdminConsoleLayoutLazy = lazy(() => import("src/pages/admin/console/AdminConsoleLayout"));
const AdminConsoleDashboardLazy = lazy(
  () => import("src/pages/admin/console/pages/DashboardPage"),
);
const AdminConsoleUsersLazy = lazy(
  () => import("src/pages/admin/console/pages/UsersPage"),
);
const AdminConsoleAdministrationLazy = lazy(
  () => import("src/pages/admin/console/pages/AdministrationPage"),
);
const AdminConsolePaymentsLazy = lazy(() => import("src/pages/admin/console/pages/PaymentsPage"));
const AdminConsoleSubscriptionsLazy = lazy(() => import("src/pages/admin/console/pages/SubscriptionsPage"));
const AdminConsoleSessionsLazy = lazy(() => import("src/pages/admin/console/pages/SessionsPage"));
const AdminConsoleEventsLazy = lazy(() => import("src/pages/admin/console/pages/EventsPage"));
const AdminConsoleInsightsLazy = lazy(() => import("src/pages/admin/console/pages/InsightsPage"));
const AdminConsoleMajorMatchLazy = lazy(() => import("src/pages/admin/console/pages/MajorMatchPage"));
const AdminConsoleCommunityModerationLazy = lazy(
  () => import("src/pages/admin/console/pages/CommunityModerationPage"),
);
const CaafAdminRouteLazy = lazy(() => import("src/pages/admin/console/CaafAdminRoute"));
const TopcoachLaunchEventAdminRouteLazy = lazy(
  () => import("src/pages/admin/console/TopcoachLaunchEventAdminRoute"),
);
const AdminProgramManagementLazy = lazy(() => import("src/pages/admin/console/pages/ProgramManagementPage"));
const AdminOrganizationManagementLazy = lazy(() => import("src/pages/admin/console/pages/OrganizationManagementPage"));
const FullSupportMentorDashboardLazy = lazy(() => import("src/pages/full-support/FullSupportMentorDashboard"));
const FullSupportMentorSatProgressPageLazy = lazy(() => import("src/pages/full-support/FullSupportMentorSatProgressPage"));
const StudentHubRoutesLazy = lazy(() => import("src/pages/student-hub/StudentHubRoutes"));
// Import factories shared between lazy() and the post-auth preload below,
// so the chunk is (almost always) already in the module cache by the time
// the post-login redirect mounts the route — no Suspense loader flash.
const importStudentHubGate = () => import("src/pages/student-hub/StudentHubGate");
const StudentHubGateLazy = lazy(importStudentHubGate);
const CommunityPostPermalinkLazy = lazy(
  () => import("src/pages/community/CommunityPostPermalinkPage"),
);
// Legacy /school-counselor surface removed in the P5 cutover — the route now
// redirects to /counselor-console (see below) so old bookmarks keep working.
const CounselorConsoleLayoutLazy = lazy(() => import("src/pages/counselor-console/CounselorConsoleLayout"));
const CounselorConsoleDashboardLazy = lazy(() => import("src/pages/counselor-console/pages/DashboardPage"));
const CounselorConsoleAnalyticsLazy = lazy(() => import("src/pages/counselor-console/pages/AnalyticsPage"));
const CounselorConsoleStudentsLazy = lazy(() => import("src/pages/counselor-console/pages/StudentsPage"));
const CounselorConsoleStudentProfileLazy = lazy(() => import("src/pages/counselor-console/pages/StudentProfilePage"));
const CounselorConsoleReportsLazy = lazy(() => import("src/pages/counselor-console/pages/ReportsPage"));
// Announcements is parked for now — the page and its backend are intact; only
// the route + sidebar entry are commented out. Restore both to bring it back.
// const CounselorConsoleAnnouncementsLazy = lazy(() => import("src/pages/counselor-console/pages/AnnouncementsPage"));
const CounselorConsoleStaffLazy = lazy(() => import("src/pages/counselor-console/pages/StaffPage"));
const CounselorConsoleSettingsLazy = lazy(() => import("src/pages/counselor-console/pages/SettingsPage"));
const CounselorConsoleAuditLazy = lazy(() => import("src/pages/counselor-console/pages/AuditPage"));
const JoinPageLazy = lazy(() => import("src/pages/join/JoinPage"));
const FullSupportLeadsPageLazy = lazy(() => import("src/pages/full-support-leads"));

const PROGRAM_TAB_SLUG: Record<string, string> = {
  users: "enrollments",
  analytics: "analytics",
  full_support: "full-support",
};

/** Old `/topcoach-management?tab=` links → unified admin program management. */
function TopCoachManagementCanonicalRedirect() {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get("tab") ?? "users";
  // Organizations is now a standalone page, no longer a Programs tab.
  if (raw === "organizations") {
    return <Navigate to="/new-admin/organization-management" replace />;
  }
  const slug = PROGRAM_TAB_SLUG[raw] ?? "enrollments";
  return <Navigate to={`/new-admin/programs/${slug}`} replace />;
}

function RouterProvider() {
  const isAuthenticated = useTypedSelector(
    (state) => state.auth.isAuthenticated
  );
  const userProfile = useTypedSelector(
    (state) => state.auth.profile
  );
  
  // SINGLE source of truth for the signed-in profile. This is the only
  // getMe that drives an app-level loader; every downstream layout/gate
  // reads the result from cache (no more stacked spinners). `refetch on
  // mount` keeps it fresh on each full app load so routing/role decisions
  // never run on a stale persisted profile.
  const { data: userData, isLoading: profileLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });

  // Also resolve the org/counselor membership here so the home redirect
  // (HomeRouter) and the student-hub gate read it from cache instead of each
  // showing their own loader.
  const { data: orgsData, isLoading: orgsLoading } = useGetMyOrgsQuery(
    undefined,
    { skip: !isAuthenticated },
  );

  // Community entitlement (preferences + subscription) decides the hub's
  // landing section (feed vs dashboard). It used to be fetched only when
  // the hub MOUNTED — so the bootstrap overlay lifted, the user briefly saw
  // the wrong section, then got re-routed once the subscription resolved.
  // Fetching both here, in parallel with getMe/orgs and covered by the same
  // overlay, means the landing decision is instant when the overlay lifts.
  const { data: prefsData, isLoading: prefsLoading } = useGetUserPreferencesQuery(
    undefined,
    { skip: !isAuthenticated },
  );
  const { data: subscriptionData, isLoading: subscriptionLoading } =
    useGetCurrentSubscriptionQuery(undefined, { skip: !isAuthenticated });

  // Prefetch the feed's first page for community-entitled users so the
  // default landing paints with content instead of skeletons. Entitlement
  // mirrors JourneyExperienceContext: subscription active/trialing, the
  // preferences flag, or the localStorage fast-path.
  const communityEntitled =
    isAuthenticated &&
    (subscriptionData?.status === 'active' ||
      subscriptionData?.status === 'trialing' ||
      ((prefsData as any)?.data ?? prefsData)?.applicationSettings
        ?.communityExperienceMode === 'community' ||
      (typeof localStorage !== 'undefined' &&
        localStorage.getItem('topcoach_community_enrolled') === 'true'));
  useListPostsQuery(FEED_DEFAULT_ARGS, { skip: !communityEntitled });

  // Warm the landing-page chunks while the bootstrap data loads, so the
  // redirect after sign-in mounts an already-cached module instead of
  // flashing a Suspense loader. Students land on /student-hub (whose chunk
  // includes the hub shell + feed); mentors land on the console schedule.
  useEffect(() => {
    if (!isAuthenticated) return;
    importStudentHubGate();
    import("src/pages/mentor/console/MentorConsoleLayout");
    import("src/pages/mentor/console/pages/SchedulePage");
  }, [isAuthenticated]);

  // App-bootstrap gate: while the authenticated user's profile (+ org
  // membership, which the very first redirect needs) is loading, cover the
  // app with ONE full-screen loader OVERLAY instead of letting each
  // route/layout/gate flash its own.
  //
  // Rendered as an overlay — NOT an early return — on purpose. The old
  // `return <Loader/>` unmounted the whole router mid sign-in (the gate
  // fires right after navigate('/') when getMe/orgs are still in flight),
  // then remounted everything when they resolved: every layout, page and
  // loader restarted, which read as 3–4 loader "flashes". It also forced an
  // /auth/* carve-out because unmounting the Google callback re-ran the
  // single-use code exchange. With an overlay the tree underneath stays
  // mounted (callback keeps running, navigation proceeds), so neither
  // problem exists: the user sees one continuous loader from sign-in to
  // landing page.
  // Entitlement queries are part of the gate: all four requests run in
  // parallel, so this only lengthens the overlay by the slowest of them —
  // and removes the wrong-section flash + re-route that used to follow.
  const bootstrapLoading =
    isAuthenticated &&
    ((profileLoading && !userData) ||
      (orgsLoading && !orgsData) ||
      (prefsLoading && !prefsData) ||
      (subscriptionLoading && !subscriptionData));

  // Use userData if available, otherwise fall back to userProfile from store
  const currentUser = userData || userProfile;
  const isSuperAdminOrOwner = currentUser?.managementRole === 'SuperAdmin' || currentUser?.managementRole === 'Owner';
  const isMentor = currentUser?.profile?.role === 'Mentor';

  return (
    <CustomRouter history={customHistory}>
      {bootstrapLoading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10_000,
          }}
        >
          <Loader height="100vh" instant />
        </div>
      )}
      <NavigationProgressBar />
      <PostHogPageView />
      <GlobalModals />
      <Routes>
        <Route element={<RootLayout />}>
          {/* Help */}
          <Route path="/help" element={<HelpPageLazy />} />

          {/* Full Support Leads – static lead-gen page (no nav, no buttons/links) */}
          <Route
            path="/full-support-leads"
            element={
              <Suspense fallback={<Loader height="100vh" />}>
                <FullSupportLeadsPageLazy />
              </Suspense>
            }
          />

          <Route element={<AddFallbackLayout />}>
            <Route path="/new-admin" element={<AdminConsoleGate />}>
              {/* ISC 2026 admissions console — full-screen takeover (its own
                  sidebar), gated by AdminConsoleGate, outside AdminConsoleLayout. */}
              <Route
                path="events/isc-2026"
                element={
                  ISC_2026_ENABLED ? (
                    <div style={{ height: '100vh' }}>
                      <Suspense fallback={<Loader height="100vh" />}>
                        <Isc2026ConsoleLazy />
                      </Suspense>
                    </div>
                  ) : (
                    <Navigate to="/new-admin/events" replace />
                  )
                }
              />
              <Route
                element={
                  <Suspense
                    fallback={
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          minHeight: '100vh',
                        }}
                      >
                        <Loader height="100vh" />
                      </div>
                    }
                  >
                    <AdminConsoleLayoutLazy />
                  </Suspense>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminConsoleDashboardLazy />} />

                {/* Unified users directory (tabs via ?tab= query) */}
                <Route path="users" element={<AdminConsoleUsersLazy />} />

                {/* Programs */}
                <Route path="programs" element={<Navigate to="/new-admin/programs/enrollments" replace />} />
                <Route path="programs/enrollments" element={<AdminProgramManagementLazy />} />
                <Route path="programs/analytics" element={<Navigate to="/new-admin/insights" replace />} />
                {/* Organizations moved out of Programs into a standalone page */}
                <Route path="programs/organizations" element={<Navigate to="/new-admin/organization-management" replace />} />
                <Route path="programs/full-support" element={<AdminProgramManagementLazy />} />
                <Route path="programs/research-prep" element={<AdminProgramManagementLazy />} />

                {/* School / organization management (standalone) */}
                <Route path="organization-management" element={<AdminOrganizationManagementLazy />} />

                {/* Operations */}
                <Route path="payments" element={<AdminConsolePaymentsLazy />} />
                <Route path="subscriptions" element={<AdminConsoleSubscriptionsLazy />} />
                <Route path="sessions" element={<AdminConsoleSessionsLazy />} />
                <Route path="events" element={<AdminConsoleEventsLazy />} />
                <Route path="events/caaf" element={<CaafAdminRouteLazy />} />
                <Route
                  path="events/topcoach-launch-event"
                  element={<TopcoachLaunchEventAdminRouteLazy />}
                />

                {/* Insights + governance */}
                <Route path="insights" element={<AdminConsoleInsightsLazy />} />
                <Route path="major-match" element={<AdminConsoleMajorMatchLazy />} />
                <Route path="administration" element={<AdminConsoleAdministrationLazy />} />
                <Route path="community-moderation" element={<AdminConsoleCommunityModerationLazy />} />

                {/* Permanent redirects from legacy console paths */}
                <Route path="mentees" element={<Navigate to="/new-admin/users?tab=mentees" replace />} />
                <Route path="mentors" element={<Navigate to="/new-admin/users?tab=mentors" replace />} />
                <Route path="organizations" element={<Navigate to="/new-admin/organization-management" replace />} />
                <Route path="content" element={<Navigate to="/new-admin/events" replace />} />
                <Route path="central-asian-admissions-forum" element={<Navigate to="/new-admin/events/caaf" replace />} />
                <Route path="management" element={<Navigate to="/new-admin/programs/enrollments" replace />} />
                <Route path="management/users" element={<Navigate to="/new-admin/programs/enrollments" replace />} />
                <Route path="management/analytics" element={<Navigate to="/new-admin/insights" replace />} />
                <Route path="management/organizations" element={<Navigate to="/new-admin/organization-management" replace />} />
                <Route path="management/full_support" element={<Navigate to="/new-admin/programs/full-support" replace />} />
                <Route path="full-support" element={<Navigate to="/new-admin/programs/full-support" replace />} />
                <Route path="access-programs" element={<Navigate to="/new-admin/dashboard" replace />} />
              </Route>
            </Route>
          </Route>

          {/* Counselor Console — org-scoped console. Mounted as a SIBLING of
              MainLayout (like /new-admin above), NOT inside it: org staff get
              the console and nothing else — no marketing site header/footer. */}
          <Route element={<AddFallbackLayout />}>
            <Route path="/counselor-console" element={<CounselorConsoleGate />}>
              <Route element={<CounselorConsoleLayoutLazy />}>
                <Route index element={<CounselorConsoleDashboardLazy />} />
                <Route path="analytics" element={<CounselorConsoleAnalyticsLazy />} />
                <Route path="students" element={<CounselorConsoleStudentsLazy />} />
                <Route path="students/:userId" element={<CounselorConsoleStudentProfileLazy />} />
                {/* /invitations was folded into the Students page as a tab —
                    keep old links working. */}
                <Route path="invitations" element={<Navigate to="/counselor-console/students?tab=invitations" replace />} />
                <Route path="reports" element={<CounselorConsoleReportsLazy />} />
                {/* Parked — see CounselorConsoleAnnouncementsLazy above. */}
                {/* <Route path="announcements" element={<CounselorConsoleAnnouncementsLazy />} /> */}
                <Route path="staff" element={<CounselorConsoleStaffLazy />} />
                <Route path="settings" element={<CounselorConsoleSettingsLazy />} />
                <Route path="audit" element={<CounselorConsoleAuditLazy />} />
              </Route>
            </Route>
          </Route>

          {/* Main Layout */}
          <Route element={<MainLayout />}>
            <Route element={<AddFallbackLayout />}>
              <Route
                index
                element={
                  isAuthenticated ? (
                    <Suspense fallback={<Loader height="100vh" />}>
                      <HomeRouter />
                    </Suspense>
                  ) : (
                    <LandingPageLazy />
                  )
                }
              />
              <Route
                path="/universities"
                element={<UniversitiesPageLazy />}
              />
              <Route
                path="/universities/:id"
                element={<UniversityDetailPageLazy />}
              />
              <Route path="/mentors" element={<MentorsPageLazy />} />
              <Route
                path="/mentors/:id"
                element={<MentorDetailsPageLazy />}
              />
              <Route path="/events" element={<EventsPageLazy />} />
              <Route
                path="/events/central-asian-admissions-forum"
                element={
                  <Suspense fallback={<Loader height="70vh" />}>
                    <CentralAsianAdmissionsForumPageLazy />
                  </Suspense>
                }
              />
              <Route
                path="/events/topcoach-launch-event"
                element={
                  <Suspense fallback={<Loader height="70vh" />}>
                    <TopcoachLaunchEventPageLazy />
                  </Suspense>
                }
              />
              {/* Legacy placement-test URLs — redirect to the hub
                  sections where the pages now live (so the sidebar
                  shows). Direct deep-links + external bookmarks stay
                  functional. */}
              <Route
                path="/placement-test"
                element={
                  <Navigate
                    to="/student-hub?section=placement-test"
                    replace
                  />
                }
              />
              <Route
                path="/placement-test/profile"
                element={
                  <Navigate
                    to="/student-hub?section=placement-profile"
                    replace
                  />
                }
              />
              <Route
                path="/placement-test/profile/:step"
                element={<PlacementProfileRedirect />}
              />
              <Route
                path="/placement-test/roadmap"
                element={
                  <Navigate
                    to="/student-hub?section=placement-roadmap"
                    replace
                  />
                }
              />
              <Route
                path="/events/:id"
                element={<EventDetailsPageLazy />}
              />
              <Route path="/programs" element={<ProgramsPageLazy />} />
              <Route path="/programs/full-support" element={<ProgramsFullSupportPageLazy />} />
              <Route path="/programs/admissions" element={<ProgramsAdmissionsPageLazy />} />
              <Route path="/programs/admissions-mentorship" element={<ProgramsAdmissionsMentorshipPageLazy />} />
              <Route path="/programs/sat" element={<ProgramsSatPageLazy />} />
              <Route path="/programs/research" element={<ProgramsResearchPageLazy />} />
              <Route 
                path="/learning" 
                element={
                  isAuthenticated ? <LearningPageLazy /> : <Navigate to="/auth/signin" replace />
                } 
              />
              <Route 
                path="/learning/:lessonId" 
                element={
                  isAuthenticated ? <LearningPageLazy /> : <Navigate to="/auth/signin" replace />
                } 
              />
              <Route 
                path="/programs/admissions/learning" 
                element={
                  isAuthenticated ? <Navigate to="/learning?course=admissions" replace /> : <Navigate to="/auth/signin" replace />
                } 
              />
              <Route 
                path="/programs/admissions/learning/:lessonId" 
                element={
                  isAuthenticated ? <LearningPageLazy /> : <Navigate to="/auth/signin" replace />
                } 
              />
              <Route path="/programs/success" element={<ProgramsSuccessPageLazy />} />
              <Route path="/contact-form" element={<ContactFormPageLazy />} />
              {/* Community Feed — single-post permalink (auth-walled). */}
              <Route
                path="/community/post/:id"
                element={
                  <Suspense fallback={<Loader height="100vh" />}>
                    <CommunityPostPermalinkLazy />
                  </Suspense>
                }
              />
              {/* Student Hub: mentees only; mentors/counselors → their own home (see StudentHubGate) */}
              <Route
                path="/student-hub/*"
                element={
                  !isAuthenticated ? (
                    <Navigate to="/" replace />
                  ) : (
                    <Suspense fallback={<Loader height="100vh" />}>
                      <StudentHubGateLazy />
                    </Suspense>
                  )
                }
              />
              {/* Legacy surface removed — redirect old links to the console. */}
              <Route
                path="/school-counselor/*"
                element={<Navigate to="/counselor-console" replace />}
              />

              {/* Public "Join" landing — the org invitation accept step. Public
                  (no gate) so a prospective member can view it signed-out; the
                  page itself preserves the token across signup/login. */}
              <Route
                path="/join/:token"
                element={
                  <Suspense fallback={<Loader height="100vh" />}>
                    <JoinPageLazy />
                  </Suspense>
                }
              />
              <Route path="/course-admin" element={<AdminNavLazy />} />
              <Route path="/course-admin/courses/modules" element={<CourseManagementAdminLazy />} />
              <Route
                path="/topcoach-management"
                element={
                  !isAuthenticated ? (
                    <Navigate to="/auth/signin" replace />
                  ) : profileLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                      <Loader height="100vh" />
                    </div>
                  ) : isSuperAdminOrOwner ? (
                    <TopCoachManagementCanonicalRedirect />
                  ) : (
                    <Navigate to="/auth/signin" replace />
                  )
                }
              />
              <Route
                path="/full-support/admin"
                element={
                  !isAuthenticated ? (
                    <Navigate to="/auth/signin" replace />
                  ) : profileLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                      <Loader height="100vh" />
                    </div>
                  ) : isSuperAdminOrOwner ? (
                    <Navigate to="/new-admin/programs/full-support" replace />
                  ) : (
                    <Navigate to="/auth/signin" replace />
                  )
                }
              />
              <Route
                path="/full-support/mentor"
                element={<Navigate to="/mentor/dashboard" replace />}
              />
              <Route
                path="/full-support/mentor/sat-progress"
                element={
                  !isAuthenticated ? (
                    <Navigate to="/auth/signin" replace />
                  ) : profileLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                      <Loader height="100vh" />
                    </div>
                  ) : isMentor || isSuperAdminOrOwner ? (
                    <Suspense fallback={<Loader height="100vh" />}>
                      <FullSupportMentorSatProgressPageLazy />
                    </Suspense>
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              {/* Unified Mentor Console — nested inside MainLayout so the website header stays. */}
              <Route path="/mentor" element={<MentorConsoleGate />}>
                <Route element={<MentorConsoleLayoutLazy />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  {/* "dashboard" path kept for old links/bookmarks — the page is the Schedule. */}
                  <Route path="dashboard" element={<MentorConsoleScheduleLazy />} />
                  <Route path="students" element={<MentorConsoleStudentsLazy />} />
                  <Route path="students/:id" element={<MentorStudentWorkspaceLazy />} />
                  <Route path="availability" element={<MentorConsoleAvailabilityLazy />} />
                  <Route path="feed" element={<MentorConsoleFeedLazy />} />
                  {/* Sessions merged into the Schedule; per-student review lives in each workspace. */}
                  <Route path="sessions" element={<Navigate to="/mentor/dashboard" replace />} />
                  <Route path="to-review" element={<Navigate to="/mentor/students" replace />} />
                  <Route path="tasks" element={<Navigate to="/mentor/students" replace />} />
                  <Route path="milestones" element={<Navigate to="/mentor/students" replace />} />
                  <Route path="research-grading" element={<Navigate to="/mentor/students" replace />} />
                  <Route path="research-prep" element={<MentorResearchPrepLearnerLazy />} />
                  <Route path="profile" element={<MentorConsoleProfileLazy />} />
                </Route>
              </Route>
              <Route
                path="/events/undergraduate"
                element={<ApplyToEventUndergraduatePageLazy />}
              />
              <Route
                path="/events/graduate"
                element={<ApplyToEventGraduatePage />}
              />
              <Route
                path="/success-stories"
                element={<SuccessStoriesPageLazy />}
              />
              <Route
                path="/success-stories/:id"
                element={<SuccessStoriesDetailPageLazy />}
              />
              <Route path="/contact" element={<ContactPageLazy />} />
              <Route path="/faq" element={<FaqPageLazy />} />
              <Route
                path="/privacy-policy"
                element={<PrivacyPolicyPageLazy />}
              />
              <Route
                path="terms-and-conditions"
                element={<TermsAndConditionsPageLazy />}
              />
              <Route path="/payment" element={<PaymentPageLazy />} />
              <Route
                path="/payment/sms"
                element={<PaymentSmsPageLazy />}
              />
              <Route path="*" element={<Custom404PageLazy />} />
            </Route>
          </Route>

          {/* Auth layout */}
          <Route element={<AddFallbackLayout />}>
            <Route path="/auth" element={<AuthLayoutLazy />}>
              <Route path="signin" element={<SignInPageLazy />} />
              <Route path="signup" element={<SignUpPageLazy />} />
              <Route
                path="signup/mentor"
                element={<MentorRegistrationPageLazy />}
              />
              <Route
                path="signup/student"
                element={<StudentRegistrationPageLazy />}
              />
              <Route
                path="/auth/google"
                element={<GoogleAuthenticationPageLazy />}
              />
              <Route
                path="/auth/google/callback"
                element={<GoogleAuthenticationPageLazy />}
              />
              <Route
                path="/auth/forgot-password"
                element={<ForgotPageLazy />}
              />
              <Route
                path="/auth/forgot-password/sent"
                element={<EmailSentPageLazy />}
              />
              <Route
                path="/auth/forgot-password/confirm"
                element={<SetNewPasswordPage />}
              />
            </Route>
            <Route
              path="/auth/verification"
              element={<VerificationPageLazy />}
            />
            <Route
              path="/auth/verify/email"
              element={<VerificationPageLazy />}
            />
          </Route>
        </Route>
        {/* ISC 2026 — all routes are dark until ISC_2026_ENABLED is flipped on. */}
        {ISC_2026_ENABLED && (
          <>
            {/* public applicant portal (real home, full-screen) */}
            <Route
              path="/events/international-summer-camp-2026"
              element={
                <div style={{ height: '100vh' }}>
                  <Suspense fallback={<Loader height="100vh" />}>
                    <Isc2026ApplicantLazy />
                  </Suspense>
                </div>
              }
            />
            {/* reviewer console (gated: Reviewer or SuperAdmin) */}
            <Route
              path="/isc-2026/review"
              element={
                <div style={{ height: '100vh' }}>
                  <Suspense fallback={<Loader height="100vh" />}>
                    <Isc2026ReviewerGateLazy>
                      <Isc2026ConsoleLazy variant="reviewer" />
                    </Isc2026ReviewerGateLazy>
                  </Suspense>
                </div>
              }
            />
            {/* dev preview harness (applicant + console, mock switcher).
                Kept dev-only so the "PREVIEW · mock data" switcher never
                becomes publicly reachable once the feature is launched. */}
            {import.meta.env.DEV && (
              <Route
                path="/isc-2026"
                element={
                  <Suspense fallback={<Loader height="100vh" />}>
                    <Isc2026PreviewLazy />
                  </Suspense>
                }
              />
            )}
          </>
        )}
      </Routes>
    </CustomRouter>
  );
}

const AddFallbackLayout = () => {
  return (
    <Suspense fallback={<Loader height="100vh" />}>
      <ErrorBoundary fallbackRender={ErrorFallback}>
        <Outlet />
      </ErrorBoundary>
    </Suspense>
  );
};

export default RouterProvider;
