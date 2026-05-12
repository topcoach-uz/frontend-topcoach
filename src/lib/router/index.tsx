import { lazy, Suspense } from "react";
import {
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
  Navigate,
  useSearchParams,
} from "react-router-dom";
import { Spin } from "antd";
import { useTypedSelector } from "src/app/store";
import { useGetMeQuery } from "src/app/services/users";
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
import NavigationProgressBar from "src/components/NavigationProgressBar";

// Pages

const HomePage = lazy(() => import("src/pages/home"));
const HomeRouter = lazy(() => import("src/pages/home/HomeRouter"));
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
const CentralAsianAdmissionsForumPageLazy = lazy(
  () => import("src/pages/events/central-asian-admissions-forum")
);
const TopcoachLaunchEventPageLazy = lazy(
  () => import("src/pages/events/topcoach-launch-event")
);
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
const ProgramsAdmissionsPageLazy = lazy(() => import("src/pages/programs/admissions"));
const ProgramsSatPageLazy = lazy(() => import("src/pages/programs/sat"));
const ProgramsSuccessPageLazy = lazy(() => import("src/pages/programs/success"));
const LearningPageLazy = lazy(() => import("src/pages/learning"));
const CourseManagementAdminLazy = lazy(() => import("src/pages/admin/courses/modules"));
const MentorConsoleLayoutLazy = lazy(() => import("src/pages/mentor/console/MentorConsoleLayout"));
const MentorConsoleDashboardLazy = lazy(() => import("src/pages/mentor/console/pages/DashboardPage"));
const MentorConsoleStudentsLazy = lazy(() => import("src/pages/mentor/console/pages/StudentsPage"));
const MentorConsoleSessionsLazy = lazy(() => import("src/pages/mentor/console/pages/SessionsPage"));
const MentorConsoleAvailabilityLazy = lazy(() => import("src/pages/mentor/console/pages/AvailabilityPage"));
const MentorConsoleTasksLazy = lazy(() => import("src/pages/mentor/console/pages/TasksPage"));
const MentorConsoleMilestonesLazy = lazy(() => import("src/pages/mentor/console/pages/MilestonesPage"));
const MentorConsoleProfileLazy = lazy(() => import("src/pages/mentor/console/pages/ProfilePage"));
const MentorResearchPrepLearnerLazy = lazy(
  () => import("src/pages/mentor/console/pages/ResearchPrepLearnerPage"),
);
const MentorResearchGradingLazy = lazy(() => import("src/pages/mentor/research-grading"));
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
const AdminConsoleSessionsLazy = lazy(() => import("src/pages/admin/console/pages/SessionsPage"));
const AdminConsoleEventsLazy = lazy(() => import("src/pages/admin/console/pages/EventsPage"));
const AdminConsoleInsightsLazy = lazy(() => import("src/pages/admin/console/pages/InsightsPage"));
const AdminConsoleMajorMatchLazy = lazy(() => import("src/pages/admin/console/pages/MajorMatchPage"));
const CaafAdminRouteLazy = lazy(() => import("src/pages/admin/console/CaafAdminRoute"));
const TopcoachLaunchEventAdminRouteLazy = lazy(
  () => import("src/pages/admin/console/TopcoachLaunchEventAdminRoute"),
);
const AdminProgramManagementLazy = lazy(() => import("src/pages/admin/console/pages/ProgramManagementPage"));
const FullSupportMentorDashboardLazy = lazy(() => import("src/pages/full-support/FullSupportMentorDashboard"));
const FullSupportMentorSatProgressPageLazy = lazy(() => import("src/pages/full-support/FullSupportMentorSatProgressPage"));
const StudentHubRoutesLazy = lazy(() => import("src/pages/student-hub/StudentHubRoutes"));
const StudentHubGateLazy = lazy(() => import("src/pages/student-hub/StudentHubGate"));
const SchoolCounselorPageLazy = lazy(() => import("src/pages/school-counselor"));
const FullSupportLeadsPageLazy = lazy(() => import("src/pages/full-support-leads"));

const PROGRAM_TAB_SLUG: Record<string, string> = {
  users: "enrollments",
  analytics: "analytics",
  organizations: "organizations",
  full_support: "full-support",
};

/** Old `/topcoach-management?tab=` links → unified admin program management. */
function TopCoachManagementCanonicalRedirect() {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get("tab") ?? "users";
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
  
  // Fetch user profile to ensure managementRole is loaded
  const { data: userData, isLoading: profileLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  
  // Use userData if available, otherwise fall back to userProfile from store
  const currentUser = userData || userProfile;
  const isSuperAdminOrOwner = currentUser?.managementRole === 'SuperAdmin' || currentUser?.managementRole === 'Owner';
  const isMentor = currentUser?.profile?.role === 'Mentor';

  return (
    <CustomRouter history={customHistory}>
      <NavigationProgressBar />
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
                        <Spin size="large" />
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
                <Route path="programs/analytics" element={<AdminProgramManagementLazy />} />
                <Route path="programs/organizations" element={<AdminProgramManagementLazy />} />
                <Route path="programs/full-support" element={<AdminProgramManagementLazy />} />
                <Route path="programs/research-prep" element={<AdminProgramManagementLazy />} />

                {/* Operations */}
                <Route path="payments" element={<AdminConsolePaymentsLazy />} />
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

                {/* Permanent redirects from legacy console paths */}
                <Route path="mentees" element={<Navigate to="/new-admin/users?tab=mentees" replace />} />
                <Route path="mentors" element={<Navigate to="/new-admin/users?tab=mentors" replace />} />
                <Route path="organizations" element={<Navigate to="/new-admin/programs/organizations" replace />} />
                <Route path="content" element={<Navigate to="/new-admin/events" replace />} />
                <Route path="central-asian-admissions-forum" element={<Navigate to="/new-admin/events/caaf" replace />} />
                <Route path="management" element={<Navigate to="/new-admin/programs/enrollments" replace />} />
                <Route path="management/users" element={<Navigate to="/new-admin/programs/enrollments" replace />} />
                <Route path="management/analytics" element={<Navigate to="/new-admin/programs/analytics" replace />} />
                <Route path="management/organizations" element={<Navigate to="/new-admin/programs/organizations" replace />} />
                <Route path="management/full_support" element={<Navigate to="/new-admin/programs/full-support" replace />} />
                <Route path="full-support" element={<Navigate to="/new-admin/programs/full-support" replace />} />
                <Route path="access-programs" element={<Navigate to="/new-admin/dashboard" replace />} />
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
                    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}><Spin size="large" /></div>}>
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
              <Route
                path="/events/:id"
                element={<EventDetailsPageLazy />}
              />
              <Route path="/programs" element={<ProgramsPageLazy />} />
              <Route path="/programs/admissions" element={<ProgramsAdmissionsPageLazy />} />
              <Route path="/programs/sat" element={<ProgramsSatPageLazy />} />
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
              {/* Student Hub: mentees + oumarovna + sheraliozodov6; mentors/counselors → / (except sheraliozodov6) */}
              <Route
                path="/student-hub/*"
                element={
                  !isAuthenticated ? (
                    <Navigate to="/" replace />
                  ) : (
                    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><Spin size="large" /></div>}>
                      <StudentHubGateLazy />
                    </Suspense>
                  )
                }
              />
              <Route 
                path="/school-counselor/*"
                element={<SchoolCounselorPageLazy />}
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
                      <Spin size="large" />
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
                      <Spin size="large" />
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
                      <Spin size="large" />
                    </div>
                  ) : isMentor || isSuperAdminOrOwner ? (
                    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}><Spin size="large" /></div>}>
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
                  <Route path="dashboard" element={<MentorConsoleDashboardLazy />} />
                  <Route path="students" element={<MentorConsoleStudentsLazy />} />
                  <Route path="sessions" element={<MentorConsoleSessionsLazy />} />
                  <Route path="availability" element={<MentorConsoleAvailabilityLazy />} />
                  <Route path="tasks" element={<MentorConsoleTasksLazy />} />
                  <Route path="milestones" element={<MentorConsoleMilestonesLazy />} />
                  <Route path="research-prep" element={<MentorResearchPrepLearnerLazy />} />
                  <Route path="research-grading" element={<MentorResearchGradingLazy />} />
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
