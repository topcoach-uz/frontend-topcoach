import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from 'src/app/api';
import { useGetMeQuery } from 'src/app/services/users';
import { useGetMyOrgsQuery } from 'src/app/services/counselorConsoleApi';
import { useGetUserPreferencesQuery } from 'src/app/services/student-hub/dashboardApi';
import { useGetCurrentSubscriptionQuery } from 'src/app/services/subscription';
import { CustomButton } from 'src/components/common';
import Loader from 'src/components/loader';
import { Logo } from 'src/components/logos';
import { ACCESS_TOKEN, REFRESH_TOKEN } from 'src/constants/storage';
import useParamsHook from 'src/hooks/params';
import TitleDescriptionPair from '../signin/_components/title_description_pair';
import RoleCard from '../signup/_components/role_card';
import styles from './AuthGoogle.module.scss';
import { useAppDispatch } from 'src/app/store';
import { loginCheck, updateProfile } from 'src/app/slices/authSlice';
import { UserRole, ProfilesSchema } from 'src/app/api/Api';
import { UserType } from 'src/app/type';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
// import { PhoneNumberModal } from 'src/components/form/item/PhoneFormItem';

// Define a partial type for profile updates
type PartialProfileUpdate = Partial<Pick<ProfilesSchema, 'profileComplete' | 'role'>>;

// Module-level guard: short codes already exchanged during this page load.
// Survives component remounts (a ref would not), so even if the page is
// remounted mid-flow the single-use code is never POSTed twice (a second
// exchange of a spent code 401s and bounces the user to login).
const exchangedCodes = new Set<string>();

export default function GoogleAuthenticationPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { searchParams } = useParamsHook();
  const shortCode = searchParams.get('c') || '';
  const exchangeToken = searchParams.get('exchangeToken') || '';
  const [exchangeSuccess, setExchangeSuccess] = useState(false);
  const exchangedRef = useRef(false);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  // const [showPhoneModal, setShowPhoneModal] = useState(false);
  // const [pendingPhone, setPendingPhone] = useState<string>('');

  const { data, isLoading, isFetching, refetch } = useGetMeQuery(undefined, {
    skip: !exchangeSuccess,
    refetchOnMountOrArgChange: true,
  });

  // True only once a FRESH profile for the just-exchanged token has arrived.
  const profileReady = exchangeSuccess && !isLoading && !isFetching && !!data;
  const profileComplete = profileReady && !!data?.profile?.profileComplete;

  // Warm the bootstrap data (org membership + community entitlement) in
  // parallel with the profile fetch, and hold the redirect until it's all
  // cached. Without this, navigating away re-triggered the router's
  // bootstrap overlay — a SECOND full-screen loader right after this
  // page's own one. Same cache entries as RouterProvider's hooks.
  const { isLoading: orgsWarming } = useGetMyOrgsQuery(undefined, {
    skip: !exchangeSuccess,
  });
  const { isLoading: prefsWarming } = useGetUserPreferencesQuery(undefined, {
    skip: !exchangeSuccess,
  });
  const { isLoading: subscriptionWarming } = useGetCurrentSubscriptionQuery(
    undefined,
    { skip: !exchangeSuccess },
  );
  const bootstrapReady = !orgsWarming && !prefsWarming && !subscriptionWarming;

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

  // Only redirect away from the role picker once we KNOW (from fresh data)
  // the profile is already complete — never on a stale cached profile, which
  // would skip the picker and leave a new mentor stuck as the default student.
  useEffect(() => {
    // Wait for BOTH the fresh profile and the warmed bootstrap data — then
    // the landing page renders instantly, with no second loader.
    if (!profileComplete || !bootstrapReady) return;
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
  }, [profileComplete, bootstrapReady, navigate]);

  const [selected, setSelected] = useState<UserType>(UserRole.Student);

  const handleChange = (key: UserType) => {
    setSelected(key);
  };

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

  const handleSubmit = async () => {
    if (selected === UserRole.Mentor) {
      setSubmitting(true);
      const profileUpdatePayload = { profile: { role: UserRole.Mentor } };
      dispatch(updateProfile(profileUpdatePayload as any))
        .unwrap()
        .then(() => {
          // For mentor signup, we don't redirect to the stored URL yet
          // as they need to complete their profile first
          navigate('/auth/signup/mentor?step=1');
        })
        .catch((err) => {
          message.error(err.message, 10);
        })
        .finally(() => setSubmitting(false));
    } else {
      // Student: complete profile without phone number
      setSubmitting(true);
      const profileUpdate: PartialProfileUpdate = {
        profileComplete: true,
        role: UserRole.Student
      };
      
      dispatch(updateProfile({ profile: profileUpdate as any }))
        .unwrap()
        .then(() => {
          // Return to where the user came from, but never an auth page.
          const redirectUrl = localStorage.getItem('redirectAfterLogin');
          localStorage.removeItem('redirectAfterLogin');
          if (redirectUrl && !redirectUrl.startsWith('/auth')) {
            window.location.href = redirectUrl;
          } else {
            navigate('/');
          }
        })
        .catch((err) => {
          message.error(err.message, 10);
        })
        .finally(() => setSubmitting(false));
    }
  };

  // Show loader until a fresh profile has arrived, and while redirecting an
  // already-complete profile away. The role picker only renders once we have
  // confirmed (from fresh data) the profile still needs completing.
  // Same rings Loader as the route's Suspense fallback and the bootstrap
  // overlay — visually one continuous loader instead of a design switch.
  if (!profileReady || profileComplete) {
    return <Loader height="100vh" instant />;
  }

  return (
    <div>
      <Link className={styles.logo} to="/">
        <Logo />
      </Link>
      <TitleDescriptionPair
        title="Welcome!"
        description="Are you a mentor or a student?"
      />

      <div className={styles.container}>
        <RoleCard handleChange={handleChange} selected={selected} />
        <CustomButton
          onClick={handleSubmit}
          type="primary"
          width="100%"
          loading={submitting}
        >
          {t('btn.continue')}
        </CustomButton>
      </div>
    </div>
  );
}
