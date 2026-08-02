import { useState } from 'react';
import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Compass, Lock } from 'lucide-react';
import { CustomButton } from 'src/components/common';
import { useUpdateMyStudentProfileMutation } from 'src/app/services/student-hub/studentProfileApi';
import { useMajorMatchPromptState } from 'src/hooks/useMajorMatchPrompt';
import {
  useMajorMatchProfileFieldsState,
  MajorMatchProfileFieldsBody,
} from './MajorMatchProfileFields';
import './MajorMatchPromptModal.scss';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * On-demand counterpart to MajorMatchPromptModal, opened by the "Try this
 * free AI major tool" hero CTA on My Progress instead of navigating straight
 * to the assessment. Shares the same optional profile-field collection body
 * and persist-then-navigate behavior as the auto-popup (see
 * MajorMatchProfileFields.tsx for the shared pieces + merge discipline) —
 * but is fully controlled (open/onClose, no session-auto-open) and offers an
 * explicit "Skip for now" path: the student got here deliberately (clicked
 * the CTA), so unlike the auto-popup's passive "Later" (which just closes
 * and re-prompts later), Skip proceeds straight to the assessment without
 * collecting anything — these fields are optional, never a gate.
 */
export default function MajorMatchCollectModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, canStart, requiresCommunityEnrollment, destination } = useMajorMatchPromptState();
  const [updateMyStudentProfile] = useUpdateMyStudentProfileMutation();
  const fields = useMajorMatchProfileFieldsState();
  const [submitting, setSubmitting] = useState(false);

  const showUnlockCta = !canStart && requiresCommunityEnrollment;

  const handleSkip = () => {
    onClose();
    navigate(destination);
  };

  const handleContinue = async () => {
    setSubmitting(true);
    try {
      // Best-effort only — never blocks navigation, same as
      // MajorMatchPromptModal's handleTakeAssessment.
      const patch = fields.buildPatch(profile);
      if (patch) {
        try {
          await updateMyStudentProfile(patch as any).unwrap();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(
            '[majorMatchCollect] could not save profile fields to student profile (best-effort, non-blocking)',
            err,
          );
        }
      }
      onClose();
      navigate(destination);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={520}
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
        onClick={handleContinue}
      >
        {showUnlockCta ? (
          <>
            <Lock size={14} style={{ marginRight: 6 }} />
            {t('studentHub.majorMatchPrompt.unlockCta', 'Unlock unlimited matches')}
          </>
        ) : (
          t('studentHub.majorMatchPrompt.continueCta', 'Continue to AI Major Match')
        )}
      </CustomButton>

      {!showUnlockCta && (
        <button type="button" className="major-match-prompt-modal__later" onClick={handleSkip}>
          {t('studentHub.majorMatchPrompt.skipCta', 'Skip for now')}
        </button>
      )}
    </Modal>
  );
}
