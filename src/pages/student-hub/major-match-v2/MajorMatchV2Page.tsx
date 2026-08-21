import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';

import { useStudentProfile } from '../../../hooks/useStudentHub';
import { useCommunityAccessGate } from '../../../lib/communityAccess';
import {
  useAnalyseMm3Mutation,
  useGetMajorMatchStatusQuery,
  useGetLatestMm3ReportQuery,
  Mm3Report,
} from '../../../app/services/student-hub/majorMatchApi';
import { MM3_PARTS, MM3_QUESTION_ORDER, MM3_QUESTIONS_BY_ID } from './mm3-content';
import {
  buildMm3CountryHints,
  buildMm3Payload,
  buildMm3Prefill,
  isKnownMm3Slug,
} from './mm3-payload';
import { isMM3Answered, MM3Answer } from './components/MM3Inputs';
import { MM3Intro } from './components/MM3Intro';
import { MM3Runner } from './components/MM3Runner';
import { MM3Analyzing } from './components/MM3Analyzing';
import { MM3Results } from './components/MM3Results';
import { MM2Results } from './components/MM2Results';
import './MajorMatchV2Page.scss';

/**
 * Major Match — the 30-question, 3-part experience.
 *
 * Honors the SAME prop contract as the legacy `PsychometricAssessmentPage`
 * (`readOnly?`, `studentId?`, `onExit?`) so the four existing mounts keep
 * working untouched.
 *
 * Two engines are visible here on purpose:
 *  • Students run MM3 — answers go to Gemini, which returns majors plus
 *    universities drawn from our own catalogue.
 *  • Counselors (`readOnly`) still read a stored v2 result when one exists.
 *    MM3 does not persist yet, so without this a counselor would suddenly see
 *    "hasn't completed" for every student who has in fact completed one. The
 *    old results stay readable — that is also the documented rollback path.
 *
 * MM3 is single-submit: the only resume story is a localStorage draft of
 * in-progress answers on this device, cleared once a report comes back.
 */
export interface MajorMatchV2PageProps {
  readOnly?: boolean;
  studentId?: string;
  onExit?: () => void;
}

type MM3Step = 'intro' | 'questions' | 'analyzing' | 'results';

const draftKey = (studentProfileId: string) => `topcoach_mm3_draft_${studentProfileId}`;

interface MM3Draft {
  answers: Record<string, MM3Answer>;
  currentIndex: number;
}

const loadDraft = (studentProfileId: string): MM3Draft | null => {
  try {
    const raw = localStorage.getItem(draftKey(studentProfileId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MM3Draft;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.answers !== 'object') {
      return null;
    }
    // Drop anything whose question no longer exists so a stale draft from an
    // older question set can't wedge the runner.
    const answers: Record<string, MM3Answer> = {};
    for (const [slug, value] of Object.entries(parsed.answers || {})) {
      if (isKnownMm3Slug(slug)) answers[slug] = value as MM3Answer;
    }
    return {
      answers,
      currentIndex:
        typeof parsed.currentIndex === 'number'
          ? Math.min(Math.max(parsed.currentIndex, 0), MM3_QUESTION_ORDER.length - 1)
          : 0,
    };
  } catch {
    return null;
  }
};

const saveDraft = (studentProfileId: string, draft: MM3Draft) => {
  try {
    localStorage.setItem(draftKey(studentProfileId), JSON.stringify(draft));
  } catch {
    // Best-effort only — localStorage fails in private mode / at quota.
    // Losing the draft costs the student re-answering, not data integrity:
    // nothing is persisted server-side until the report comes back anyway.
  }
};

const clearDraft = (studentProfileId: string) => {
  try {
    localStorage.removeItem(draftKey(studentProfileId));
  } catch {
    // no-op
  }
};

const MajorMatchV2Page: React.FC<MajorMatchV2PageProps> = ({
  readOnly = false,
  studentId,
  onExit,
}) => {
  const { t } = useTranslation();
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

  // A prior MM3 report, if the student has already completed one — restores
  // "View full results" after a refresh/re-navigation (MM3 is single-submit
  // and in-session `report` state doesn't survive a reload on its own), and
  // is what powers the counselor read-only view below.
  const { data: storedReport } = useGetLatestMm3ReportQuery(studentProfileId || '', {
    skip: !studentProfileId,
  });

  const [analyseMm3, { isLoading: analysing }] = useAnalyseMm3Mutation();

  const [step, setStep] = useState<MM3Step>('intro');
  const [answers, setAnswers] = useState<Record<string, MM3Answer>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [report, setReport] = useState<Mm3Report | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [prefilledSlugs, setPrefilledSlugs] = useState<readonly string[]>([]);
  const hydratedRef = useRef(false);
  const reportHydratedRef = useRef(false);

  // Seed `report` from the stored one the first time it arrives, as long as
  // nothing already took its place in-session (a just-finished/just-retaken
  // in-session report must never be clobbered by a stale stored fetch).
  useEffect(() => {
    if (reportHydratedRef.current || report || !storedReport) return;
    reportHydratedRef.current = true;
    setReport(storedReport);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedReport]);

  // Seed once per profile: a saved draft wins over prefill (the student's own
  // in-progress edits must never be clobbered by profile values).
  useEffect(() => {
    if (!studentProfileId || hydratedRef.current || readOnly) return;
    hydratedRef.current = true;

    const prefill = buildMm3Prefill(studentProfile, t);
    const draft = loadDraft(studentProfileId);

    if (draft && Object.keys(draft.answers).length > 0) {
      setAnswers({ ...prefill.answers, ...draft.answers });
      setCurrentIndex(draft.currentIndex);
      setHasDraft(true);
    } else if (Object.keys(prefill.answers).length > 0) {
      setAnswers(prefill.answers);
    }
    setPrefilledSlugs(prefill.slugs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentProfileId, readOnly]);

  // Persist while actively answering.
  useEffect(() => {
    if (!studentProfileId || step !== 'questions') return;
    saveDraft(studentProfileId, { answers, currentIndex });
  }, [studentProfileId, step, answers, currentIndex]);

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

  /* Which of the three parts are fully answered. Derived from the same
     `answers` map the localStorage draft restores, so a student who leaves
     mid-way returns to "1/3 done" without anything being persisted
     server-side. Same-device only — see the draft note above. */
  const partsCompleted = useMemo(
    () =>
      MM3_PARTS.map((part) =>
        part.questionIds.every((id) => {
          const question = MM3_QUESTIONS_BY_ID.get(id);
          return question ? isMM3Answered(question, answers[question.slug]) : false;
        }),
      ),
    [answers],
  );

  const handleUnlock = () => navigate(gate.destination);

  const handleAnswer = (slug: string, value: MM3Answer) => {
    setAnswers((prev) => ({ ...prev, [slug]: value }));
  };

  const handleAnalyse = async () => {
    // Re-check every question rather than trusting the button state — a
    // restored draft can land the student mid-set with earlier gaps.
    const missingIndex = MM3_QUESTION_ORDER.findIndex((id) => {
      const question = MM3_QUESTIONS_BY_ID.get(id);
      return question ? !isMM3Answered(question, answers[question.slug]) : false;
    });
    if (missingIndex >= 0) {
      setCurrentIndex(missingIndex);
      message.warning(
        t('majorMatch3.validation.answerAll', 'Please answer this question to continue.'),
      );
      return;
    }

    setStep('analyzing');
    try {
      const result = await analyseMm3({
        answers: buildMm3Payload(answers, t),
        countryHints: buildMm3CountryHints(answers),
      }).unwrap();

      setReport(result);
      setStep('results');
      if (studentProfileId) clearDraft(studentProfileId);
      setHasDraft(false);
    } catch (error: any) {
      console.error('Major Match analysis error:', error);
      message.error(
        error?.data?.message ||
          t(
            'majorMatch3.error.analyseFailed',
            "We couldn't build your report just now. Your answers are saved — please try again.",
          ),
      );
      // Back to the last question with answers intact, never a dead end.
      setStep('questions');
      setCurrentIndex(MM3_QUESTION_ORDER.length - 1);
    }
  };

  const goNext = () => {
    const question = MM3_QUESTIONS_BY_ID.get(MM3_QUESTION_ORDER[currentIndex]);
    if (question && !isMM3Answered(question, answers[question.slug])) {
      message.warning(
        t('majorMatch3.validation.answerAll', 'Please answer this question to continue.'),
      );
      return;
    }
    if (currentIndex === MM3_QUESTION_ORDER.length - 1) {
      void handleAnalyse();
      return;
    }
    setCurrentIndex((i) => i + 1);
  };

  const goBack = () => setCurrentIndex((i) => Math.max(0, i - 1));

  // A stored result from the retired v2 engine, shown to BOTH students and
  // counselors when there is no MM3 report to show instead.
  //
  // This used to be gated on `readOnly`, which stranded every student who had
  // completed v2 but not MM3: the profile card reads `major_match_results`
  // directly and offers "View full results", but this page forced the legacy
  // result to null, so `hasReport` was false and the intro said "Begin the
  // assessment" — a promise the destination couldn't keep. Their own stored
  // result is theirs to read; MM3 simply takes precedence when one exists.
  const legacyResult = useMemo(() => status?.latest ?? null, [status]);

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
          {t(
            'majorMatch.error.profileRequired',
            'Please complete your profile before taking the assessment.',
          )}
        </p>
        <button
          type="button"
          className="mm2__btn mm2__btn--primary"
          onClick={() => (onExit ? onExit() : navigate('/student-hub/profile'))}
        >
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
            <MM3Intro
              readOnly={readOnly}
              hasReport={!!report || !!legacyResult}
              access={status?.access}
              hasDraft={hasDraft}
              partsCompleted={partsCompleted}
              onStart={() => setStep('questions')}
              onViewResults={() => setStep('results')}
              onUnlock={handleUnlock}
            />
          )}

          {step === 'questions' && (
            <MM3Runner
              currentIndex={currentIndex}
              answers={answers}
              prefilledSlugs={prefilledSlugs}
              submitting={analysing}
              onAnswer={handleAnswer}
              onNext={goNext}
              onBack={goBack}
              onExit={() => {
                setStep('intro');
                goExit();
              }}
            />
          )}

          {step === 'analyzing' && <MM3Analyzing />}

          {step === 'results' && report && (
            <MM3Results
              report={report}
              readOnly={readOnly}
              access={status?.access}
              onRetake={() => {
                setReport(null);
                setCurrentIndex(0);
                setStep('questions');
              }}
              onUnlock={handleUnlock}
              onBack={() => setStep('intro')}
            />
          )}

          {/* Stored result from the retired v2 engine — shown when there is no
              MM3 report. A student sees their own past result and can retake
              (which runs MM3, the current engine); a counselor stays read-only. */}
          {step === 'results' && !report && legacyResult && (
            <MM2Results
              result={legacyResult}
              readOnly={readOnly}
              access={status?.access}
              onRetake={() => {
                setCurrentIndex(0);
                setStep('questions');
              }}
              onUnlock={handleUnlock}
              onBack={() => setStep('intro')}
            />
          )}
        </>
      )}
    </div>
  );
};

export default MajorMatchV2Page;
