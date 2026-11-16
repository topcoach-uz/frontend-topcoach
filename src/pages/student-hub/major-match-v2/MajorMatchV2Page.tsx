import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import { MM3_PARTS, MM3_QUESTION_ORDER, getMm3QuestionMap } from './mm3-content';
import {
  buildMm3CountryHints,
  buildMm3Payload,
  buildMm3Prefill,
} from './mm3-payload';
import { isMM3Answered, MM3Answer } from './components/MM3Inputs';
import { MM3Intro } from './components/MM3Intro';
import { NextStepCard } from '../applicant/NextStepCard';
import { MM3Runner } from './components/MM3Runner';
import { MM3Review } from './components/MM3Review';
import { readMm3Location, writeMm3Location, type MM3Step } from './mm3-navigation';
import { clearMm3Draft, loadMm3Draft, saveMm3Draft } from './mm3-draft';
import { MM3Analyzing } from './components/MM3Analyzing';
import { MM3Results } from './components/MM3Results';
import { MM2Results } from './components/MM2Results';
import { ApplicantMobileTrail } from '../applicant/ApplicantTopBarContext';
import '../applicant/applicantPages.scss';
import './MajorMatchV2Page.scss';
import './mm3-workspace.scss';

/** Shared student/counselor entry. Reports persist on the server; in-progress
 * answers stay in a profile-specific local draft until a report is generated. */
export interface MajorMatchV2PageProps {
  readOnly?: boolean;
  studentId?: string;
  onExit?: () => void;
}

const MajorMatchV2Page: React.FC<MajorMatchV2PageProps> = ({
  readOnly = false,
  studentId,
  onExit,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const gate = useCommunityAccessGate();

  const hookOptions = readOnly && studentId ? { studentId } : undefined;
  const { profile: studentProfile, isLoading: profileLoading } = useStudentProfile(hookOptions);
  const studentProfileId = studentProfile?.id;
  const targetDegree = studentProfile?.academicProfile?.targetDegree ?? 'bachelor';
  const questionsById = useMemo(() => getMm3QuestionMap(targetDegree), [targetDegree]);
  // Keep undergraduate drafts compatible, but never restore school answers
  // into a graduate questionnaire after the applicant changes their goal.
  const draftProfileKey = studentProfileId ? `${studentProfileId}${targetDegree === 'master' ? ':master' : ''}` : undefined;

  const {
    data: status,
    isLoading: statusLoading,
    isFetching: statusFetching,
  } = useGetMajorMatchStatusQuery(studentProfileId || '', { skip: !studentProfileId });

  // A prior MM3 report, if the student has already completed one — restores
  // "View full results" after a refresh/re-navigation (MM3 is single-submit
  // and in-session `report` state doesn't survive a reload on its own), and
  // is what powers the counselor read-only view below.
  const { data: storedReport, isLoading: reportLoading } = useGetLatestMm3ReportQuery(studentProfileId || '', {
    skip: !studentProfileId,
  });

  const [analyseMm3, { isLoading: analysing }] = useAnalyseMm3Mutation();

  const [readOnlyStep, setReadOnlyStep] = useState<MM3Step>('intro');
  const [answers, setAnswers] = useState<Record<string, MM3Answer>>({});
  const [resumeIndex, setResumeIndex] = useState(0);
  const [draftStep, setDraftStep] = useState<'questions' | 'review'>('questions');
  const location = readMm3Location(searchParams, resumeIndex);
  const currentIndex = location.currentIndex;
  // A reload cannot resume an in-flight mutation: return to the saved review.
  const step = readOnly ? readOnlyStep : location.step === 'analyzing' && !analysing ? 'review' : location.step;
  const goToStep = (nextStep: MM3Step, index = currentIndex, editPart?: number, replace = false) => {
    if (readOnly) {
      setReadOnlyStep(nextStep === 'results' ? 'results' : 'intro');
      return;
    }
    setSearchParams(writeMm3Location(searchParams, nextStep, index, editPart), { replace });
  };
  const [report, setReport] = useState<Mm3Report | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [prefilledSlugs, setPrefilledSlugs] = useState<readonly string[]>([]);
  const hydratedRef = useRef<string>();
  const reportHydratedRef = useRef(false);
  const submittingRef = useRef(false);
  const [hydratedKey, setHydratedKey] = useState<string>();

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
    if (!draftProfileKey || hydratedRef.current === draftProfileKey || readOnly) return;
    hydratedRef.current = draftProfileKey;

    const prefill = buildMm3Prefill(studentProfile, t);
    const draft = loadMm3Draft(draftProfileKey);

    if (draft && Object.keys(draft.answers).length > 0) {
      setAnswers({ ...prefill.answers, ...draft.answers });
      setResumeIndex(draft.currentIndex);
      setDraftStep(draft.step ?? 'questions');
      setHasDraft(true);
    } else {
      setAnswers(prefill.answers);
      setResumeIndex(0);
      setHasDraft(false);
    }
    setPrefilledSlugs(prefill.slugs);
    setHydratedKey(draftProfileKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftProfileKey, readOnly]);

  // Persist while actively answering.
  useEffect(() => {
    if (!draftProfileKey || hydratedKey !== draftProfileKey || readOnly || (step !== 'questions' && step !== 'review')) return;
    saveMm3Draft(draftProfileKey, { answers, currentIndex, step });
    setHasDraft(true);
    setDraftStep(step);
  }, [draftProfileKey, hydratedKey, readOnly, step, answers, currentIndex]);

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
          const question = questionsById.get(id);
          return question ? isMM3Answered(question, answers[question.slug]) : false;
        }),
      ),
    [answers, questionsById],
  );

  const handleUnlock = () => navigate(gate.destination);

  const handleAnswer = (slug: string, value: MM3Answer) => {
    setAnswers((prev) => ({ ...prev, [slug]: value }));
  };

  const handleAnalyse = async () => {
    if (readOnly || submittingRef.current) return;
    if (status?.access && !status.access.canStart) {
      handleUnlock();
      return;
    }
    // Re-check every question rather than trusting the button state — a
    // restored draft can land the student mid-set with earlier gaps.
    const missingIndex = MM3_QUESTION_ORDER.findIndex((id) => {
      const question = questionsById.get(id);
      return question ? !isMM3Answered(question, answers[question.slug]) : false;
    });
    if (missingIndex >= 0) {
      goToStep('questions', missingIndex);
      message.warning(
        t('majorMatch3.validation.answerAll', 'Please answer this question to continue.'),
      );
      return;
    }

    submittingRef.current = true;
    goToStep('analyzing');
    try {
      const result = await analyseMm3({
        answers: buildMm3Payload(answers, t, targetDegree),
        targetDegree,
        countryHints: buildMm3CountryHints(answers),
      }).unwrap();

      setReport(result);
      goToStep('results', 0, undefined, true);
      if (draftProfileKey) clearMm3Draft(draftProfileKey);
      setHasDraft(false);
    } catch (error: unknown) {
      console.error('Major Match analysis error:', error);
      const serverMessage = error && typeof error === 'object' && 'data' in error
        && error.data && typeof error.data === 'object' && 'message' in error.data
        && typeof error.data.message === 'string'
        ? error.data.message
        : null;
      message.error(
        serverMessage ||
          t(
            'majorMatch3.error.analyseFailed',
            "We couldn't build your report just now. Your answers are saved — please try again.",
          ),
      );
      // Keep the reviewed answers available for a retry after a server error.
      goToStep('review', currentIndex, undefined, true);
    } finally {
      submittingRef.current = false;
    }
  };

  const goNext = () => {
    const question = questionsById.get(MM3_QUESTION_ORDER[currentIndex]);
    if (question && !isMM3Answered(question, answers[question.slug])) {
      message.warning(
        t('majorMatch3.validation.answerAll', 'Please answer this question to continue.'),
      );
      return;
    }
    if (currentIndex === MM3_QUESTION_ORDER.length - 1) {
      goToStep('review');
      return;
    }
    if (location.editPart && currentIndex + 1 === location.editPart * 10) {
      goToStep('review');
      return;
    }
    goToStep('questions', currentIndex + 1, location.editPart);
  };

  const goBack = () => currentIndex === 0 ? goToStep('intro') : goToStep('questions', currentIndex - 1, location.editPart);

  const startAssessment = () => {
    if (status?.access && !status.access.canStart) {
      handleUnlock();
      return;
    }
    // A partially completed retake wins over the older persisted report.
    // Keep that report in memory so "View results" still works if the
    // student exits the retake before submitting the replacement.
    if (hasDraft) {
      goToStep(partsCompleted.every(Boolean) || draftStep === 'review' ? 'review' : 'questions', resumeIndex);
      return;
    }
    if (report || status?.latest) {
      setAnswers(buildMm3Prefill(studentProfile, t).answers);
      goToStep('questions', 0);
      return;
    }
    goToStep(partsCompleted.every(Boolean) || draftStep === 'review' ? 'review' : 'questions', resumeIndex);
  };

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

  if (profileLoading || (!readOnly && draftProfileKey && hydratedKey !== draftProfileKey)) {
    return (
      <div className="applicant-page applicant-specialist-page mm2__state">
        <span className="mm2__spinner" />
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="applicant-page applicant-specialist-page mm2__state">
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
    <div className={`applicant-page applicant-specialist-page mm2-page mm3-workspace student-hub-page mm3-workspace--${step}`}>
      {!readOnly && (
        <>
          <nav className="mm3-workspace__breadcrumb" aria-label={t('common.breadcrumb', 'Breadcrumb')}>
            <span><Link to="/student-hub">{t('applicantWorkspace.myJourney', 'My Journey')}</Link><span aria-hidden="true"> / </span>{t('studentHub.nav.aiMajorMatch', 'AI Major Match')}</span>
            {(step === 'questions' || step === 'review') && <button type="button" onClick={goExit}>{t('majorMatch.nav.exit', 'Save & exit')}</button>}
          </nav>
          <ApplicantMobileTrail>{t('studentHub.nav.aiMajorMatch', 'AI Major Match')}</ApplicantMobileTrail>
        </>
      )}
      {(statusLoading || statusFetching) && step === 'intro' && !status ? (
        <div className="mm2__state">
          <span className="mm2__spinner" />
        </div>
      ) : (
        <>
          {step === 'intro' && !readOnly && <NextStepCard current="major-match" />}
          {step === 'intro' && (
            <MM3Intro
              targetDegree={targetDegree}
              readOnly={readOnly}
              hasReport={!!report || !!legacyResult}
              access={status?.access}
              hasDraft={hasDraft}
              partsCompleted={partsCompleted}
              onStart={startAssessment}
              onViewResults={() => goToStep('results')}
              onChooseDirect={() => navigate('/student-hub/universities')}
              onUnlock={handleUnlock}
            />
          )}

          {step === 'questions' && (
            <MM3Runner
              targetDegree={targetDegree}
              currentIndex={currentIndex}
              answers={answers}
              prefilledSlugs={prefilledSlugs}
              submitting={analysing}
              onAnswer={handleAnswer}
              onNext={goNext}
              onBack={goBack}
              onExit={goExit}
              showSaveExit={false}
              onReturnToReview={location.editPart ? () => goToStep('review') : undefined}
            />
          )}

          {step === 'review' && !readOnly && (
            <MM3Review targetDegree={targetDegree} answers={answers} submitting={analysing}
              onEdit={(index, part) => goToStep('questions', index, part)}
              onBack={() => goToStep('questions', MM3_QUESTION_ORDER.length - 1)}
              onSubmit={() => void handleAnalyse()} />
          )}

          {step === 'analyzing' && <MM3Analyzing />}

          {step === 'results' && !report && !legacyResult && (
            <div className="mm2__state">
              {reportLoading || statusLoading ? <span className="mm2__spinner" /> : <>
                <p className="mm2__state-title">{t('majorMatch3.results.notReady', 'Your report is not ready yet')}</p>
                <button className="mm2__btn mm2__btn--primary" onClick={() => goToStep('intro')}>{t('common.back', 'Back')}</button>
              </>}
            </div>
          )}

          {step === 'results' && report && (
            <MM3Results
              report={report}
              readOnly={readOnly}
              access={status?.access}
              onRetake={startAssessment}
              onUnlock={handleUnlock}
              onBack={() => goToStep('intro')}
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
              onRetake={startAssessment}
              onUnlock={handleUnlock}
              onBack={() => goToStep('intro')}
            />
          )}
        </>
      )}
    </div>
  );
};

export default MajorMatchV2Page;
