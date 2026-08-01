import { useEffect, useRef, useState } from 'react';
import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Compass, Lock } from 'lucide-react';
import { CustomButton } from 'src/components/common';
import { useUpdateMyStudentProfileMutation } from 'src/app/services/student-hub/studentProfileApi';
import { MAJOR_MATCH_PROMPT_CLOSED_KEY, useMajorMatchPromptState } from 'src/hooks/useMajorMatchPrompt';
import {
  useMajorMatchProfileFieldsState,
  MajorMatchProfileFieldsBody,
} from './MajorMatchProfileFields';
import './MajorMatchPromptModal.scss';

/** Same chrome-less surfaces StudentHubLayout already excludes from other
 * hub-wide chrome (SAT Prep) plus the psychometric-assessment route itself
 * — never nag the student while they're already on/taking the assessment. */
const isExcludedPath = (pathname: string) =>
  pathname.startsWith('/student-hub/psychometric-assessment') ||
  pathname.startsWith('/student-hub/sat-prep');

/**
 * Once-per-browser-session auto-opening prompt nudging a student who hasn't
 * completed the Major Match assessment to take it, from the hub landing
 * (feed for enrolled users, My Progress for everyone else — both render
 * through StudentHubLayout, which is where this is mounted).
 *
 * "Once per session": this component is mounted once at the layout level
 * and never unmounts across in-app navigation, so the auto-open effect
 * below only ever fires once per page load naturally. `sessionStorage`
 * exists purely to survive a hard reload within the same browser tab/
 * session — closing the tab (or a fresh session) clears it, so the prompt
 * returns until the assessment is actually completed (see
 * useMajorMatchPromptState's doc comment for how completion is detected).
 */
export default function MajorMatchPromptModal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    profile,
    shouldPrompt,
    hasCompletedAssessment,
    canStart,
    requiresCommunityEnrollment,
    destination,
  } = useMajorMatchPromptState();
  const [updateMyStudentProfile] = useUpdateMyStudentProfileMutation();

  const [open, setOpen] = useState(false);
  const hasAutoOpened = useRef(false);
  const fields = useMajorMatchProfileFieldsState();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hasAutoOpened.current) return;
    if (!shouldPrompt) return;
    if (sessionStorage.getItem(MAJOR_MATCH_PROMPT_CLOSED_KEY) === 'true') return;
    hasAutoOpened.current = true;
    setOpen(true);
  }, [shouldPrompt]);

  // The assessment was completed elsewhere (e.g. the user opened it from
  // the sidebar directly) while this was queued to reopen — don't show a
  // stale prompt for a test that's already done.
  //
  // IMPORTANT: this must key off `hasCompletedAssessment`, NOT `shouldPrompt`.
  // `shouldPrompt` also flips to false whenever either underlying query
  // (getLatestAssessment / getMajorMatchAccessStatus) is transiently
  // *loading* — e.g. an RTK Query refetch mid-session — or whenever
  // `studentProfileId` is briefly undefined for any reason. Gating the
  // auto-close on `shouldPrompt` made the modal flicker open/closed on its
  // own with no user action, because a loading blip looked identical to
  // "assessment completed". `hasCompletedAssessment` only becomes true once
  // `getLatestAssessment` actually returns a completed assessment, so this
  // effect now only closes the modal for the real reason it exists for.
  useEffect(() => {
    if (open && hasCompletedAssessment) setOpen(false);
  }, [open, hasCompletedAssessment]);

  if (isExcludedPath(location.pathname)) return null;

  const handleLater = () => {
    sessionStorage.setItem(MAJOR_MATCH_PROMPT_CLOSED_KEY, 'true');
    setOpen(false);
  };

  const handleTakeAssessment = async () => {
    setSubmitting(true);
    try {
      // Best-effort only — never blocks navigation. See
      // MajorMatchProfileFields.tsx's buildPatch for the merge discipline
      // (spreads the existing academicProfile/testScores so nothing else on
      // file gets clobbered).
      const patch = fields.buildPatch(profile);
      if (patch) {
        try {
          await updateMyStudentProfile(patch as any).unwrap();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(
            '[majorMatchPrompt] could not save profile fields to student profile (best-effort, non-blocking)',
            err,
          );
        }
      }
      setOpen(false);
      navigate(destination);
    } finally {
      setSubmitting(false);
    }
  };

  const showUnlockCta = !canStart && requiresCommunityEnrollment;

  return (
    <Modal
      open={open}
      onCancel={handleLater}
      footer={null}
      centered
      width={520}
      maskClosable={false}
      className="major-match-prompt-modal"
    >
      <div className="major-match-prompt-modal__icon">
        <Compass size={22} />
      </div>
      <h2 className="major-match-prompt-modal__title">
        {t('studentHub.majorMatchPrompt.title', 'Find your best-fit major')}
      </h2>
      <p className="major-match-prompt-modal__lede">
        {t(
          'studentHub.majorMatchPrompt.lede',
          'A short AI-powered assessment matches your interests, values, and strengths to majors that actually fit you — personalized, not generic.',
        )}
      </p>

      {!showUnlockCta && <MajorMatchProfileFieldsBody {...fields} />}

      {showUnlockCta && (
        <p className="major-match-prompt-modal__unlock-note">
          {t(
            'studentHub.majorMatchPrompt.unlockNote',
            "You've used your free attempt — subscribe to Community for unlimited matches.",
          )}
        </p>
      )}

      <CustomButton
        type="primary"
        width="100%"
        loading={submitting}
        onClick={handleTakeAssessment}
      >
        {showUnlockCta ? (
          <>
            <Lock size={14} style={{ marginRight: 6 }} />
            {t('studentHub.majorMatchPrompt.unlockCta', 'Unlock unlimited matches')}
          </>
        ) : (
          t('studentHub.majorMatchPrompt.startCta', 'Take the assessment (~15 min)')
        )}
      </CustomButton>

      <button type="button" className="major-match-prompt-modal__later" onClick={handleLater}>
        {t('studentHub.majorMatchPrompt.later', 'Later')}
      </button>
    </Modal>
  );
}
