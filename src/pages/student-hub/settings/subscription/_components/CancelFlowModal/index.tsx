import { useEffect, useState } from 'react';
import { Button, Input, Modal, Radio, message } from 'antd';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useCancelSubscriptionMutation } from 'src/app/services/subscription';
import type { CancelReasonCategory } from 'src/app/services/subscription';
import type { PlanDto } from '../../types';
import { COMMUNITY_PLAN_FEATURES } from '../plan-features';
import styles from './CancelFlowModal.module.scss';

const { TextArea } = Input;

export interface CancelFlowModalProps {
  open: boolean;
  /** "Keep my subscription" at any step, backdrop click, or Esc. Never cancels anything. */
  onClose: () => void;
  subscriptionId: string;
  /** The plan effectively in force (scheduledPlan ?? plan) — mirrors the page-level rule. */
  currentPlan: PlanDto;
  /** Full active plan catalog — used to find a cheaper alternative for the "too expensive" offer. */
  plans: PlanDto[];
  periodEndLabel: string;
  /**
   * Hands the target plan to the page's EXISTING change-plan confirm flow
   * (`setPlanChangeConfirm`) — the same code path AvailablePlans uses.
   * This modal never calls `/change-plan` itself.
   */
  onOfferPlanSwitch: (plan: PlanDto) => void;
}

const planLabel = (
  plan: PlanDto,
  t: (k: string, d: string) => string,
): string =>
  plan.period === 'yearly'
    ? t('settings.subscription.plan.yearly', 'Yearly Plan')
    : t('settings.subscription.plan.monthly', 'Monthly Plan');

type ReasonKey =
  | 'too_expensive'
  | 'not_using_enough'
  | 'found_another_service'
  | 'finished_applications'
  | 'technical_problems'
  | 'other';

const REASON_KEYS: ReasonKey[] = [
  'too_expensive',
  'not_using_enough',
  'found_another_service',
  'finished_applications',
  'technical_problems',
  'other',
];

const REASON_LABEL_FALLBACK: Record<ReasonKey, string> = {
  too_expensive: "It's too expensive",
  not_using_enough: "I'm not using it enough",
  found_another_service: 'I found another service',
  finished_applications: 'I finished my applications',
  technical_problems: 'I had technical problems',
  other: 'Other',
};

/**
 * 4-step retention funnel replacing the old single-click "Cancel plan"
 * confirm. Every step offers an equally-prominent "Keep my subscription"
 * exit — none of them are disabled, greyed, or subordinate. Only step 4
 * actually calls the cancel endpoint; steps 1–3 are pure client state.
 *
 * Step 3's retention offer is tailored per step-2 reason:
 *  - too_expensive  → real /change-plan switch to a cheaper plan when one
 *    exists (the SAME flow AvailablePlans uses, via `onOfferPlanSwitch`).
 *    No pause/discount capability exists in the backend — verified by
 *    grep, nothing fake is offered for it.
 *  - everything else → a real, existing route (book a mentor session,
 *    contact support, or see other programs) — never a fabricated
 *    "capability" that doesn't exist server-side.
 */
export default function CancelFlowModal({
  open,
  onClose,
  subscriptionId,
  currentPlan,
  plans,
  periodEndLabel,
  onOfferPlanSwitch,
}: CancelFlowModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [reasonCategory, setReasonCategory] = useState<ReasonKey | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [doCancel, { isLoading: cancelling }] = useCancelSubscriptionMutation();

  // Reset internal state every time the modal is (re)opened so a prior
  // run never leaks into the next one.
  useEffect(() => {
    if (open) {
      setStep(1);
      setReasonCategory(null);
      setReasonText('');
    }
  }, [open]);

  const reasonLabel = (key: ReasonKey): string =>
    t(`settings.subscription.cancelFlow.reason.${key}`, REASON_LABEL_FALLBACK[key]);

  const goToOffer = (path: string) => {
    onClose();
    navigate(path);
  };

  // Cheapest OTHER active plan, only offered when it's genuinely cheaper
  // than what the user is on today — never a fake "switch and save" CTA.
  const cheaperPlan = plans
    .filter((p) => p.id !== currentPlan.id && p.priceUsd < currentPlan.priceUsd)
    .sort((a, b) => a.priceUsd - b.priceUsd)[0];

  const handleConfirmCancel = async () => {
    try {
      await doCancel({
        subscriptionId,
        reasonCategory: reasonCategory ?? undefined,
        reason: reasonText.trim() || undefined,
      }).unwrap();
      message.success(
        t(
          'settings.subscription.toast.cancelScheduled',
          'Cancellation scheduled. You keep access until {{date}}.',
          { date: periodEndLabel },
        ),
      );
      onClose();
    } catch (err) {
      const anyErr = err as { data?: { message?: string | string[] } };
      const m = anyErr?.data?.message;
      const text = Array.isArray(m) ? m.join(' • ') : m;
      message.error(
        text ??
          t('settings.subscription.toast.cancelFailed', "Couldn't cancel."),
      );
    }
  };

  const renderStep1 = () => (
    <div className={styles.body}>
      <p className={styles.lead}>
        {t(
          'settings.subscription.cancelFlow.step1.accessUntil',
          "You'll keep full access until {{date}}.",
          { date: periodEndLabel },
        )}
      </p>
      <p className={styles.subhead}>
        {t(
          'settings.subscription.cancelFlow.step1.loseAccessHeading',
          "You'll lose access to:",
        )}
      </p>
      <ul className={styles.featureList}>
        {COMMUNITY_PLAN_FEATURES.map((f) => (
          <li key={f.key} className={styles.featureItem}>
            <Check className={styles.featureTick} size={14} strokeWidth={2.5} aria-hidden />
            <span>{f.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderStep2 = () => (
    <div className={styles.body}>
      <p className={styles.subhead}>
        {t(
          'settings.subscription.cancelFlow.step2.subtitle',
          'This helps us improve TopCoach for everyone.',
        )}
      </p>
      <Radio.Group
        className={styles.reasonGroup}
        value={reasonCategory}
        onChange={(e) => setReasonCategory(e.target.value)}
      >
        {REASON_KEYS.map((key) => (
          <Radio key={key} value={key} className={styles.reasonOption}>
            {reasonLabel(key)}
          </Radio>
        ))}
      </Radio.Group>
      <label htmlFor="cancel-flow-reason-text" className={styles.detailsLabel}>
        {t('settings.subscription.cancelFlow.step2.detailsLabel', 'Tell us more (optional)')}
      </label>
      <TextArea
        id="cancel-flow-reason-text"
        value={reasonText}
        onChange={(e) => setReasonText(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder={t(
          'settings.subscription.cancelFlow.step2.detailsPlaceholder',
          "What's making you cancel?",
        )}
      />
    </div>
  );

  const renderOffer = () => {
    const key = reasonCategory ?? 'other';

    if (key === 'too_expensive') {
      if (cheaperPlan) {
        return (
          <div className={styles.offerCard}>
            <h4 className={styles.offerTitle}>
              {t(
                'settings.subscription.cancelFlow.step3.tooExpensive.title',
                'Try a lower-cost plan instead?',
              )}
            </h4>
            <p className={styles.offerBody}>
              {t(
                'settings.subscription.cancelFlow.step3.tooExpensive.body',
                "Switch to {{plan}} — you'll pay ${{price}} per charge instead.",
                { plan: planLabel(cheaperPlan, t), price: cheaperPlan.priceUsd.toFixed(2) },
              )}
            </p>
            <Button
              className={styles.btnFilled}
              type="primary"
              onClick={() => {
                onOfferPlanSwitch(cheaperPlan);
                onClose();
              }}
            >
              {t('settings.subscription.cancelFlow.step3.tooExpensive.cta', 'Switch to {{plan}}', {
                plan: planLabel(cheaperPlan, t),
              })}
            </Button>
          </div>
        );
      }
      return (
        <div className={styles.offerCard}>
          <h4 className={styles.offerTitle}>
            {t(
              'settings.subscription.cancelFlow.step3.tooExpensive.title',
              'Try a lower-cost plan instead?',
            )}
          </h4>
          <p className={styles.offerBody}>
            {t(
              'settings.subscription.cancelFlow.step3.tooExpensive.noCheaperPlanBody',
              "You're already on our lowest-priced option. If cost is the blocker, tell our team — we may be able to help.",
            )}
          </p>
          <Button className={styles.btnGhost} onClick={() => goToOffer('/contact')}>
            {t('settings.subscription.cancelFlow.step3.other.cta', 'Contact us')}
          </Button>
        </div>
      );
    }

    if (key === 'not_using_enough') {
      return (
        <div className={styles.offerCard}>
          <h4 className={styles.offerTitle}>
            {t('settings.subscription.cancelFlow.step3.notUsingEnough.title', "Not sure where to start?")}
          </h4>
          <p className={styles.offerBody}>
            {t(
              'settings.subscription.cancelFlow.step3.notUsingEnough.body',
              "Book a free session with a mentor and get a plan for using TopCoach — it's included in your subscription.",
            )}
          </p>
          <Button className={styles.btnFilled} type="primary" onClick={() => goToOffer('/mentors')}>
            {t('settings.subscription.cancelFlow.step3.notUsingEnough.cta', 'Book a mentor session')}
          </Button>
        </div>
      );
    }

    if (key === 'found_another_service') {
      return (
        <div className={styles.offerCard}>
          <h4 className={styles.offerTitle}>
            {t('settings.subscription.cancelFlow.step3.foundAnotherService.title', 'Before you go')}
          </h4>
          <p className={styles.offerBody}>
            {t(
              'settings.subscription.cancelFlow.step3.foundAnotherService.body',
              "We'd love to know what's missing so we can compete. Tell us what the other service does better.",
            )}
          </p>
          <Button className={styles.btnGhost} onClick={() => goToOffer('/contact')}>
            {t('settings.subscription.cancelFlow.step3.foundAnotherService.cta', "Tell us what's missing")}
          </Button>
        </div>
      );
    }

    if (key === 'finished_applications') {
      return (
        <div className={styles.offerCard}>
          <h4 className={styles.offerTitle}>
            {t(
              'settings.subscription.cancelFlow.step3.finishedApplications.title',
              'Congratulations on finishing your applications!',
            )}
          </h4>
          <p className={styles.offerBody}>
            {t(
              'settings.subscription.cancelFlow.step3.finishedApplications.body',
              'Community members also get help with scholarships, interviews, and next steps — take a look at what\'s still available to you.',
            )}
          </p>
          <Button className={styles.btnGhost} onClick={() => goToOffer('/programs')}>
            {t('settings.subscription.cancelFlow.step3.finishedApplications.cta', 'See what\'s available')}
          </Button>
        </div>
      );
    }

    if (key === 'technical_problems') {
      return (
        <div className={styles.offerCard}>
          <h4 className={styles.offerTitle}>
            {t('settings.subscription.cancelFlow.step3.technicalProblems.title', 'Sorry you hit a technical problem')}
          </h4>
          <p className={styles.offerBody}>
            {t(
              'settings.subscription.cancelFlow.step3.technicalProblems.body',
              'Tell our support team what went wrong — most issues can be fixed quickly.',
            )}
          </p>
          <Button className={styles.btnFilled} type="primary" onClick={() => goToOffer('/contact')}>
            {t('settings.subscription.cancelFlow.step3.technicalProblems.cta', 'Contact support')}
          </Button>
        </div>
      );
    }

    return (
      <div className={styles.offerCard}>
        <h4 className={styles.offerTitle}>
          {t('settings.subscription.cancelFlow.step3.other.title', 'Thanks for the feedback')}
        </h4>
        <p className={styles.offerBody}>
          {t(
            'settings.subscription.cancelFlow.step3.other.body',
            "If there's anything we can do differently, our team would love to hear from you.",
          )}
        </p>
        <Button className={styles.btnGhost} onClick={() => goToOffer('/contact')}>
          {t('settings.subscription.cancelFlow.step3.other.cta', 'Contact us')}
        </Button>
      </div>
    );
  };

  const renderStep3 = () => <div className={styles.body}>{renderOffer()}</div>;

  const renderStep4 = () => (
    <div className={styles.body}>
      <p className={styles.lead}>
        {t(
          'settings.subscription.cancelFlow.step4.body',
          "Your subscription will end on {{date}}. You'll keep full access until then, and you can reactivate any time before that date to pick up right where you left off — no need to start over.",
          { date: periodEndLabel },
        )}
      </p>
    </div>
  );

  const titleFor: Record<1 | 2 | 3 | 4, string> = {
    1: t('settings.subscription.cancelFlow.step1.title', 'Are you sure you want to cancel?'),
    2: t('settings.subscription.cancelFlow.step2.title', 'Help us understand why'),
    3: t('settings.subscription.cancelFlow.step3.title', 'One more thing'),
    4: t('settings.subscription.cancelFlow.step4.title', 'Confirm cancellation'),
  };

  const canContinueFromStep2 = !!reasonCategory;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      title={
        <div className={styles.titleRow}>
          <span>{titleFor[step]}</span>
          <span className={styles.stepIndicator}>
            {t('settings.subscription.cancelFlow.stepIndicator', 'Step {{current}} of {{total}}', {
              current: step,
              total: 4,
            })}
          </span>
        </div>
      }
    >
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      <div className={styles.footer}>
        <Button className={styles.btnFilled} type="primary" onClick={onClose}>
          {t('settings.subscription.cancelFlow.keepButton', 'Keep my subscription')}
        </Button>

        {step === 1 && (
          <Button className={styles.btnGhost} onClick={() => setStep(2)}>
            {t('settings.subscription.cancelFlow.continueButton', 'Continue')}
          </Button>
        )}
        {step === 2 && (
          <Button
            className={styles.btnGhost}
            disabled={!canContinueFromStep2}
            onClick={() => setStep(3)}
          >
            {t('settings.subscription.cancelFlow.continueButton', 'Continue')}
          </Button>
        )}
        {step === 3 && (
          <Button className={styles.btnGhost} onClick={() => setStep(4)}>
            {t('settings.subscription.cancelFlow.step3.continueButton', 'No thanks, continue')}
          </Button>
        )}
        {step === 4 && (
          <Button
            className={styles.btnDanger}
            danger
            loading={cancelling}
            onClick={handleConfirmCancel}
          >
            {t('settings.subscription.cancelFlow.step4.confirmButton', 'Cancel my subscription')}
          </Button>
        )}
      </div>
    </Modal>
  );
}
