import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';

import { useStudentProfile } from '../../../hooks/useStudentHub';
import { useCommunityAccessGate } from '../../../lib/communityAccess';
import {
  useGetMajorMatchStatusQuery,
  useSubmitMajorMatchMutation,
  MajorMatchResult,
} from '../../../app/services/student-hub/majorMatchApi';
import { MM2_QUESTION_ORDER, MM2_SCORED_MC_IDS, isShortAnswer } from './content';
import { MM2Intro } from './components/MM2Intro';
import { MM2Runner } from './components/MM2Runner';
import { MM2Analyzing } from './components/MM2Analyzing';
import { MM2Results } from './components/MM2Results';
import './MajorMatchV2Page.scss';

/**
 * Major Match v2 (MAJOR_MATCH_V2_PLAN.md Stage 4).
 *
 * Honors the SAME prop contract as the legacy `PsychometricAssessmentPage`
 * (`readOnly?`, `studentId?`, `onExit?` — see that file's doc comment) so
 * Stage 5's cutover can swap the component at the four existing mounts
 * without touching call sites.
 *
 * v2 is single-submit (plan §1/§6 Q9: no server-side session/resume) — the
 * only "resume" story is a localStorage draft of in-progress answers on
 * this device, cleared on successful submit.
 */
export interface MajorMatchV2PageProps {
  readOnly?: boolean;
  studentId?: string;
  onExit?: () => void;
}

type MM2Step = 'intro' | 'questions' | 'analyzing' | 'results';

const draftKey = (studentProfileId: string) => `topcoach_mm2_draft_${studentProfileId}`;

interface MM2Draft {
  mcAnswers: Record<number, number>;
  shortAnswers: Record<number, string>;
  currentIndex: number;
}

const loadDraft = (studentProfileId: string): MM2Draft | null => {
  try {
    const raw = localStorage.getItem(draftKey(studentProfileId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MM2Draft;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      mcAnswers: parsed.mcAnswers || {},
      shortAnswers: parsed.shortAnswers || {},
      currentIndex: typeof parsed.currentIndex === 'number' ? parsed.currentIndex : 0,
    };
  } catch {
    return null;
  }
};

const saveDraft = (studentProfileId: string, draft: MM2Draft) => {
  try {
    localStorage.setItem(draftKey(studentProfileId), JSON.stringify(draft));
  } catch {
    // best-effort only — localStorage can fail (quota/private mode); losing
    // the draft is a UX regression, not a data-integrity issue (nothing is
    // persisted server-side until a real submit).
  }
};

const clearDraft = (studentProfileId: string) => {
  try {
    localStorage.removeItem(draftKey(studentProfileId));
  } catch {
    // no-op
  }
};

const MajorMatchV2Page: React.FC<MajorMatchV2PageProps> = ({ readOnly = false, studentId, onExit }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const gate = useCommunityAccessGate();

  const hookOptions = readOnly && studentId ? { studentId } : undefined;
  const { profile: studentProfile, isLoading: profileLoading } = useStudentProfile(hookOptions);
  const studentProfileId = studentProfile?.id;

  const {
    data: status,
    isLoading: statusLoading,
    isFetching: statusFetching,
  } = useGetMajorMatchStatusQuery(studentProfileId || '', { skip: !studentProfileId });

  const [submitMajorMatch, { isLoading: submitting }] = useSubmitMajorMatchMutation();

  const [step, setStep] = useState<MM2Step>('intro');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewedResult, setViewedResult] = useState<MajorMatchResult | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  // True only when `viewedResult` was JUST produced by a submit in this
  // session (not when revisiting a past result via "View results"/intro).
  // Drives the embedded roadmap section's `freshSince` prop — see
  // MM2Results' doc comment.
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Load any saved draft once the student profile id is known (dev-route
  // scope — doesn't need to re-run on every render).
  useEffect(() => {
    if (!studentProfileId) return;
    const draft = loadDraft(studentProfileId);
    if (draft && (Object.keys(draft.mcAnswers).length > 0 || Object.values(draft.shortAnswers).some(Boolean))) {
      setAnswers(draft.mcAnswers);
      setShortAnswers(draft.shortAnswers);
      setCurrentIndex(Math.min(draft.currentIndex, MM2_QUESTION_ORDER.length - 1));
      setHasDraft(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentProfileId]);

  // Persist the draft on every change while actively answering.
  useEffect(() => {
    if (!studentProfileId || step !== 'questions') return;
    saveDraft(studentProfileId, { mcAnswers: answers, shortAnswers, currentIndex });
  }, [studentProfileId, step, answers, shortAnswers, currentIndex]);

  const exitDestination = readOnly
    ? '/student-hub/major-match-v2'
    : '/student-hub?section=ai-major-match';

  const goExit = () => {
    if (onExit) {
      onExit();
      return;
    }
    navigate(exitDestination);
  };

  const handleUnlock = () => navigate(gate.destination);

  const handleStart = () => {
    setStep('questions');
  };

  const handleViewResults = () => {
    if (status?.latest) {
      setViewedResult(status.latest);
      setJustSubmitted(false);
      setStep('results');
    }
  };

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleShortAnswerChange = (questionId: number, text: string) => {
    setShortAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const handleSubmit = async () => {
    if (!studentProfileId) return;

    const missingIndex = MM2_QUESTION_ORDER.findIndex(
      (id) => !isShortAnswer(id) && answers[id] === undefined,
    );
    if (missingIndex >= 0) {
      setCurrentIndex(missingIndex);
      message.warning(t('majorMatch.validation.selectOption', 'Please select an option to continue.'));
      return;
    }

    const mcAnswers = MM2_SCORED_MC_IDS.map((questionId) => ({
      questionId,
      optionIndex: answers[questionId],
    }));
    const shortAnswerItems = Object.entries(shortAnswers)
      .filter(([, text]) => text && text.trim().length > 0)
      .map(([questionId, text]) => ({ questionId: Number(questionId), text: text.trim() }));

    setStep('analyzing');
    try {
      const result = await submitMajorMatch({
        studentProfileId,
        mcAnswers,
        shortAnswers: shortAnswerItems,
        language: (i18n.language.split('-')[0] as 'en' | 'ru' | 'uz' | 'kk') || 'en',
      }).unwrap();

      clearDraft(studentProfileId);
      setViewedResult(result);
      setJustSubmitted(true);
      setStep('results');
      // Reset in-memory answer state now that it's persisted server-side.
      setAnswers({});
      setShortAnswers({});
      setCurrentIndex(0);
      setHasDraft(false);
    } catch (error: any) {
      console.error('Major Match v2 submit error:', error);
      message.error(
        error?.data?.message || t('majorMatch.error.submitFailed', "We couldn't submit your answers. Please try again."),
      );
      setStep('questions');
    }
  };

  const goNext = () => {
    const questionId = MM2_QUESTION_ORDER[currentIndex];
    const isLast = currentIndex === MM2_QUESTION_ORDER.length - 1;

    if (!isShortAnswer(questionId) && answers[questionId] === undefined) {
      message.warning(t('majorMatch.validation.selectOption', 'Please select an option to continue.'));
      return;
    }

    if (isLast) {
      void handleSubmit();
      return;
    }
    setCurrentIndex((i) => i + 1);
  };

  const goBack = () => setCurrentIndex((i) => Math.max(0, i - 1));

  const activeResult = useMemo(() => viewedResult || status?.latest || null, [viewedResult, status]);

  if (profileLoading) {
    return (
      <div className="mm2__state">
        <span className="mm2__spinner" />
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="mm2__state">
        <p className="mm2__state-title">{t('majorMatch.error.genericTitle', 'Something went wrong')}</p>
        <p className="mm2__state-text">
          {t('majorMatch.error.profileRequired', 'Please complete your profile before taking the assessment.')}
        </p>
        <button type="button" className="mm2__btn mm2__btn--primary" onClick={() => (onExit ? onExit() : navigate('/student-hub/profile'))}>
          {t('common.goToProfile', 'Go to Profile')}
        </button>
      </div>
    );
  }

  return (
    <div className="mm2-page student-hub-page">
      {(statusLoading || statusFetching) && step === 'intro' && !status ? (
        <div className="mm2__state">
          <span className="mm2__spinner" />
        </div>
      ) : (
        <>
          {step === 'intro' && (
            <MM2Intro
              readOnly={readOnly}
              latest={status?.latest}
              access={status?.access}
              hasDraft={hasDraft}
              onStart={handleStart}
              onViewResults={handleViewResults}
              onUnlock={handleUnlock}
            />
          )}

          {step === 'questions' && (
            <MM2Runner
              currentIndex={currentIndex}
              answers={answers}
              shortAnswers={shortAnswers}
              submitting={submitting}
              onSelectOption={handleSelectOption}
              onShortAnswerChange={handleShortAnswerChange}
              onNext={goNext}
              onBack={goBack}
              onExit={() => {
                setStep('intro');
                goExit();
              }}
            />
          )}

          {step === 'analyzing' && <MM2Analyzing />}

          {step === 'results' && activeResult && (
            <MM2Results
              result={activeResult}
              readOnly={readOnly}
              access={status?.access}
              onRetake={() => {
                setViewedResult(null);
                setJustSubmitted(false);
                setStep('questions');
              }}
              onUnlock={handleUnlock}
              onBack={() => setStep('intro')}
              freshSince={justSubmitted ? activeResult.createdAt : undefined}
            />
          )}
        </>
      )}
    </div>
  );
};

export default MajorMatchV2Page;
