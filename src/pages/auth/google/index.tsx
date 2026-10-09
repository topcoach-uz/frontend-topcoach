import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from 'src/app/api';
import { useGetMeQuery } from 'src/app/services/users';
import { useGetMyOrgsQuery } from 'src/app/services/counselorConsoleApi';
import { useGetUserPreferencesQuery } from 'src/app/services/student-hub/dashboardApi';
import { useGetCurrentSubscriptionQuery } from 'src/app/services/subscription';
import Loader from 'src/components/loader';
import { ACCESS_TOKEN, REFRESH_TOKEN } from 'src/constants/storage';
import useParamsHook from 'src/hooks/params';
import { useAppDispatch } from 'src/app/store';
import { loginCheck } from 'src/app/slices/authSlice';
import { message } from 'antd';
import { isOnboardingComplete, OnboardingStatus } from 'src/lib/onboarding';
import { trackLogin } from 'src/lib/meta-pixel';
// import { PhoneNumberModal } from 'src/components/form/item/PhoneFormItem';

// Module-level guard: short codes already exchanged during this page load.
// Survives component remounts (a ref would not), so even if the page is
// remounted mid-flow the single-use code is never POSTed twice (a second
// exchange of a spent code 401s and bounces the user to login).
const exchangedCodes = new Set<string>();

export default function GoogleAuthenticationPage() {
  const navigate = useNavigate();
  const { searchParams } = useParamsHook();
  const shortCode = searchParams.get('c') || '';
  const exchangeToken = searchParams.get('exchangeToken') || '';
  const [exchangeSuccess, setExchangeSuccess] = useState(false);
  const exchangedRef = useRef(false);
  const dispatch = useAppDispatch();
  // const [showPhoneModal, setShowPhoneModal] = useState(false);
  // const [pendingPhone, setPendingPhone] = useState<string>('');

  const { data, isLoading, isFetching, refetch } = useGetMeQuery(undefined, {
    skip: !exchangeSuccess,
    refetchOnMountOrArgChange: true,
  });

  // True only once a FRESH profile for the just-exchanged token has arrived.
  const profileReady = exchangeSuccess && !isLoading && !isFetching && !!data;
  // Google can't ask for a role at OAuth-consent time, so a fresh Google
  // user has `onboardingCompletedAt: null` the same as a fresh email
  // signup — both land on /onboarding via the same check (see
  // ONBOARDING_DESIGN.md §6). Fails open (see src/lib/onboarding.ts) until
  // the backend companion PR ships `onboardingCompletedAt` on getMe.
  const onboardingComplete =
    profileReady &&
    isOnboardingComplete(data as (typeof data & OnboardingStatus) | undefined);

  // Warm the bootstrap data (org membership + community entitlement) in
  // parallel with the profile fetch, and hold the redirect until it's all
  // cached. Without this, navigating away re-triggered the router's
  // bootstrap overlay — a SECOND full-screen loader right after this
  // page's own one. Same cache entries as RouterProvider's hooks.
  const { data: orgs, isLoading: orgsWarming, isFetching: orgsFetching } = useGetMyOrgsQuery(undefined, {
    skip: !exchangeSuccess, refetchOnMountOrArgChange: true,
  });
  const { isLoading: prefsWarming } = useGetUserPreferencesQuery(undefined, {
    skip: !exchangeSuccess,
  });
  const { isLoading: subscriptionWarming } = useGetCurrentSubscriptionQuery(
    undefined,
    { skip: !exchangeSuccess },
  );
  const bootstrapReady = !orgsWarming && !orgsFetching && !prefsWarming && !subscriptionWarming;

  useEffect(() => {
    if (exchangeSuccess) {
      refetch();
    }
  }, [exchangeSuccess]);

  // Flip isAuthenticated the moment tokens are stored (exchangeSuccess only
  // becomes true with tokens in localStorage) instead of waiting for getMe
  // to resolve — this starts the router's bootstrap queries a full network
  // round-trip earlier, in parallel with the profile fetch above.
  useEffect(() => {
    if (exchangeSuccess) dispatch(loginCheck());
  }, [exchangeSuccess, dispatch]);

  // Redirect once we KNOW (from fresh data) where this user needs to go —
  // never on a stale cached profile, which could skip onboarding for a
  // genuinely new user. Onboarding-incomplete always wins over the stored
  // redirect URL: there is nowhere else this user can usefully land first.
  useEffect(() => {
    // Wait for BOTH the fresh profile and the warmed bootstrap data — then
    // the landing page renders instantly, with no second loader.
    if (!profileReady || !bootstrapReady) return;

    if (orgs?.some(m => m.status === 'active' && m.organization.status === 'active' && (m.role === 'owner' || m.role === 'counselor')) && data?.managementRole !== 'SuperAdmin') {
      const target = localStorage.getItem('redirectAfterLogin');
      localStorage.removeItem('redirectAfterLogin');
      navigate(target?.startsWith('/join/') ? target : '/counselor-console', { replace: true });
      return;
    }
    if (!onboardingComplete) {
      navigate('/onboarding', { replace: true });
      return;
    }

    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    localStorage.removeItem('redirectAfterLogin');
    // Never bounce back to an auth page — fall back to home ('/').
    // SPA navigation (not window.location.href): getMe is already fresh in
    // the RTK cache at this point, so the landing page renders immediately
    // instead of re-bootstrapping the whole app through the loader chain.
    const target =
      redirectUrl && !redirectUrl.startsWith('/auth') ? redirectUrl : '/';
    if (/^https?:\/\//.test(target)) {
      window.location.href = target;
    } else {
      navigate(target, { replace: true });
    }
  }, [profileReady, onboardingComplete, bootstrapReady, orgs, data, navigate]);

  useEffect(() => {
    const code = shortCode || exchangeToken;
    if (!code) {
      // No code in the URL. If we already hold a session, just continue;
      // otherwise there's nothing to exchange here — go to sign-in.
      if (localStorage.getItem(ACCESS_TOKEN)) setExchangeSuccess(true);
      else navigate('/auth/signin', { replace: true });
      return;
    }

    // The short code is SINGLE-USE on the backend. Guard against exchanging it
    // more than once — within this mount (ref), across remounts in this page
    // load (module Set), and across a full reload/back-nav (sessionStorage).
    // A second exchange of a spent code 401s and bounces the user to login.
    const consumedKey = `google_exchanged:${code}`;
    const alreadyExchanged =
      exchangedRef.current ||
      exchangedCodes.has(code) ||
      !!sessionStorage.getItem(consumedKey);

    if (alreadyExchanged) {
      // Tokens were already stored by the first exchange — just proceed to
      // load the profile instead of re-POSTing the spent code.
      if (localStorage.getItem(ACCESS_TOKEN)) setExchangeSuccess(true);
      return;
    }
    exchangedRef.current = true;
    exchangedCodes.add(code);

    const exchange = shortCode
      ? api.instance.post<{ access: string; refresh: string }>('/auth/google/exchange-by-code', { code: shortCode })
      : api.auth.exchangeTokens({ code: exchangeToken });

    exchange
      .then((res: any) => {
        const data = res.data;
        sessionStorage.setItem(consumedKey, '1');
        // Store tokens BEFORE flipping exchangeSuccess so the getMe fetch
        // that follows authenticates as the new user (not the old session).
        localStorage.setItem(ACCESS_TOKEN, data.access);
        localStorage.setItem(REFRESH_TOKEN, data.refresh);
        api.instance.defaults.headers['Authorization'] = `Bearer ${data.access}`;
        // Meta Pixel: the exchange response carries only tokens — there is no
        // flag telling us whether this Google account is new. A first-time
        // Google user is therefore counted as a Login, not a registration.
        trackLogin(searchParams.get('method') === 'email' ? 'email' : 'google');
        setExchangeSuccess(true);
      })
      .catch((err: any) => {
        // If a session was already stored (e.g. a prior in-flight exchange this
        // round), don't bounce — proceed with it.
        if (localStorage.getItem(ACCESS_TOKEN)) {
          setExchangeSuccess(true);
          return;
        }
        // Genuine failure (expired / already-used code) — don't hang on the
        // loader; send the user back to retry sign-in.
        message.error(err?.response?.data?.message ?? 'Sign-in link expired. Please try again.', 8);
        navigate('/auth/signin', { replace: true });
      });
  }, [shortCode, exchangeToken, navigate]);

  // This page's only job now is the OAuth code exchange + bootstrap
  // warm-up; the role choice (formerly rendered here) moved to the
  // /onboarding wizard's Step 1 (ONBOARDING_DESIGN.md §6). It never renders
  // any UI of its own — the effect above always navigates away once ready.
  return <Loader height="100vh" instant />;
}
