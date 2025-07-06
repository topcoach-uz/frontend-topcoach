import { lazy, Suspense } from "react";
import {
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { useTypedSelector } from "src/app/store";

// Layouts
import MainLayout from "src/components/layouts/main";
import RootLayout from "src/components/layouts/root";
import Loader from "src/components/loader";
import SetNewPasswordPage from "src/pages/auth/forgot-password/set-new-password";
import { CustomRouter } from "./CustomRouter";
import customHistory from "../history";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "src/components/ErrorFallback";

// Pages

const HomePage = lazy(() => import("src/pages/home"));
const HelpPageLazy = lazy(() => import("src/pages/help"));
const Custom404PageLazy = lazy(() => import("src/pages/404"));
const SuccessStoriesPageLazy = lazy(
  () => import("src/pages/success-stories")
);
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

function RouterProvider() {
  const isAuthenticated = useTypedSelector(
    (state) => state.auth.isAuthenticated
  );

  return (
    <CustomRouter history={customHistory}>
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
                element={<AiMajorMatchPageLazy />}
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
          </Route>
        </Route>
      </Routes>
    </CustomRouter>
  );
}

const AddFallbackLayout = () => {
  return (
    <Suspense fallback={<Loader />}>
      <ErrorBoundary fallbackRender={ErrorFallback}>
        <Outlet />
      </ErrorBoundary>
    </Suspense>
  );
};

export default RouterProvider;
