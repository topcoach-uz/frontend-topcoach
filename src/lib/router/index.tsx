import { lazy, Suspense } from "react";
import {
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
  Navigate,
} from "react-router-dom";
import { Spin } from "antd";
import { useTypedSelector } from "src/app/store";
import { useGetMeQuery } from "src/app/services/users";

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

// Pages

const HomePage = lazy(() => import("src/pages/home"));
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
const AiMajorMatchPageLazy = lazy(
  () => import("src/pages/ai-major-match/AiMajorMatch")
);
const ProgramsPageLazy = lazy(() => import("src/pages/programs"));
const ProgramsAdmissionsPageLazy = lazy(() => import("src/pages/programs/admissions"));
const ProgramsSatPageLazy = lazy(() => import("src/pages/programs/sat"));
const ProgramsSuccessPageLazy = lazy(() => import("src/pages/programs/success"));
const LearningPageLazy = lazy(() => import("src/pages/learning"));
const CourseManagementAdminLazy = lazy(() => import("src/pages/admin/courses/modules"));
const AdminNavLazy = lazy(() => import("src/components/common/AdminNav"));
const TopCoachManagementLazy = lazy(() => import("src/pages/admin/topcoach-management"));
const StudentHubRoutesLazy = lazy(() => import("src/pages/student-hub/StudentHubRoutes"));
const SchoolCounselorPageLazy = lazy(() => import("src/pages/school-counselor"));

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

  return (
    <CustomRouter history={customHistory}>
      <GlobalModals />
      <Routes>
        <Route element={<RootLayout />}>
          {/* Help */}
          <Route path="/help" element={<HelpPageLazy />} />

          {/* Main Layout */}
          <Route element={<MainLayout />}>
            <Route element={<AddFallbackLayout />}>
              <Route
                index
                element={
                  isAuthenticated ? <HomePage /> : <LandingPageLazy />
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
              <Route 
                path="/student-hub/*"
                element={<StudentHubRoutesLazy />}
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
                    <TopCoachManagementLazy />
                  ) : (
                    <Navigate to="/auth/signin" replace />
                  )
                } 
              />
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
              <Route
                path="/ai-major-match"
                element={<Custom404PageLazy />}
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
