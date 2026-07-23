import { useEffect, useRef, useState } from 'react';
import { Modal, InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Compass, Lock } from 'lucide-react';
import { CustomButton } from 'src/components/common';
import { useUpdateMyStudentProfileMutation } from 'src/app/services/student-hub/studentProfileApi';
import { MAJOR_MATCH_PROMPT_CLOSED_KEY, useMajorMatchPromptState } from 'src/hooks/useMajorMatchPrompt';
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
  const { profile, shouldPrompt, canStart, requiresCommunityEnrollment, destination } =
    useMajorMatchPromptState();
  const [updateMyStudentProfile] = useUpdateMyStudentProfileMutation();

  const [open, setOpen] = useState(false);
  const hasAutoOpened = useRef(false);
  const [satTotal, setSatTotal] = useState<number | null>(null);
  const [ieltsOverall, setIeltsOverall] = useState<number | null>(null);
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
  useEffect(() => {
    if (open && !shouldPrompt) setOpen(false);
  }, [open, shouldPrompt]);

  if (isExcludedPath(location.pathname)) return null;

  const handleLater = () => {
    sessionStorage.setItem(MAJOR_MATCH_PROMPT_CLOSED_KEY, 'true');
    setOpen(false);
  };

  const handleTakeAssessment = async () => {
    setSubmitting(true);
    try {
      if (satTotal != null || ieltsOverall != null) {
        // Best-effort only — never blocks navigation. Same merge discipline
        // as StepInfo.tsx's persistCountryAndSat: spread the existing
        // academicProfile/testScores so nothing else on file gets clobbered,
        // and never touch personalProfile (its DTO 400s on partial writes).
        try {
          const existingAcademic = (profile?.academicProfile as any) ?? {};
          const patch: Record<string, unknown> = {
            academicProfile: {
              ...existingAcademic,
              testScores: {
                ...(existingAcademic.testScores ?? {}),
                ...(satTotal != null
                  ? { sat: { ...(existingAcademic.testScores?.sat ?? {}), total: satTotal } }
                  : {}),
                ...(ieltsOverall != null
                  ? {
                      ielts: {
                        ...(existingAcademic.testScores?.ielts ?? {}),
                        overall: ieltsOverall,
                      },
                    }
                  : {}),
              },
            },
          };
          await updateMyStudentProfile(patch as any).unwrap();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(
            '[majorMatchPrompt] could not save SAT/IELTS to student profile (best-effort, non-blocking)',
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
      width={480}
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

      {!showUnlockCta && (
        <div className="major-match-prompt-modal__fields">
          <p className="major-match-prompt-modal__fields-hint">
            {t(
              'studentHub.majorMatchPrompt.fieldsHint',
              "Optional — sharpens your results if you have them handy.",
            )}
          </p>
          <div className="major-match-prompt-modal__field-row">
            <label className="major-match-prompt-modal__field">
              <span>{t('studentHub.majorMatchPrompt.satLabel', 'SAT total (optional)')}</span>
              <InputNumber
                min={400}
                max={1600}
                placeholder={t('studentHub.majorMatchPrompt.satPlaceholder', 'e.g. 1450')}
                value={satTotal}
                onChange={(v) => setSatTotal(typeof v === 'number' ? v : null)}
                style={{ width: '100%' }}
              />
            </label>
            <label className="major-match-prompt-modal__field">
              <span>{t('studentHub.majorMatchPrompt.ieltsLabel', 'IELTS overall (optional)')}</span>
              <InputNumber
                min={0}
                max={9}
                step={0.5}
                placeholder={t('studentHub.majorMatchPrompt.ieltsPlaceholder', 'e.g. 7.0')}
                value={ieltsOverall}
                onChange={(v) => setIeltsOverall(typeof v === 'number' ? v : null)}
                style={{ width: '100%' }}
              />
            </label>
          </div>
        </div>
      )}

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
