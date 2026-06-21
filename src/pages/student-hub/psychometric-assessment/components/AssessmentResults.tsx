import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Compass, Star, Globe, RotateCcw, Info, Rocket, Lock, ArrowRight, Users, Zap } from 'lucide-react';
import type {
  PsychometricAssessment,
  RecommendationsResponse,
} from '../../../../app/services/student-hub/psychometricApi';
import { RiasecRadarChart, RIASEC_DESCRIPTIONS } from './RiasecRadarChart';
import { ValuesChart } from './ValuesChart';
import { BigFiveChart } from './BigFiveChart';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { UniversityMatches } from './UniversityMatches';
import './AssessmentResults.scss';

interface AssessmentResultsProps {
  assessmentId: string;
  studentProfileId: string;
  assessment?: PsychometricAssessment;
  recommendations?: RecommendationsResponse;
  onRetake: () => void;
  /** When true, the free attempt is used up — "Retake" becomes an unlock CTA. */
  retakeLocked?: boolean;
  onTakeAptitude?: () => void;
  isLoading: boolean;
  isGeneratingResults?: boolean; // True when initially completing, false when viewing existing
}

// Plain-language adjective per RIASEC dimension — lets us describe the
// student's profile in human terms ("hands-on, enterprising, detail-oriented")
// instead of leading with a bare "E-R-C" code that means nothing to them.
const RIASEC_ADJECTIVES: Record<string, string> = {
  R: 'hands-on',
  I: 'analytical',
  A: 'creative',
  S: 'people-focused',
  E: 'enterprising',
  C: 'detail-oriented',
};

// Career path visualization component
const CareerPathCard: React.FC<{
  majorName: string;
  careers: string[];
  relatedMajors?: string[];
}> = ({ majorName, careers = [], relatedMajors }) => {
  const safeCareers = Array.isArray(careers) ? careers : [];
  const safeRelatedMajors = Array.isArray(relatedMajors) ? relatedMajors : [];
  if (safeCareers.length === 0 && safeRelatedMajors.length === 0) return null;
  return (
    <div className="majormatch-results__rec-block">
      {safeCareers.length > 0 && (
        <>
          <span className="majormatch-results__rec-block-label">
            <Rocket size={12} style={{ marginRight: 6, verticalAlign: '-2px' }} />
            Career Paths for {majorName}
          </span>
          <div className="majormatch-results__rec-pills">
            {safeCareers.map((career, i) => (
              <span key={i} className="majormatch-results__tag majormatch-results__tag--brand">
                {typeof career === 'string' ? career : String(career)}
              </span>
            ))}
          </div>
        </>
      )}
      {safeRelatedMajors.length > 0 && (
        <div style={{ marginTop: safeCareers.length > 0 ? 10 : 0 }}>
          <span className="majormatch-results__rec-block-label">Related Majors</span>
          <div className="majormatch-results__rec-pills">
            {safeRelatedMajors.map((major, i) => (
              <span key={i} className="majormatch-results__tag">
                {typeof major === 'string' ? major : String(major)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const AssessmentResults: React.FC<AssessmentResultsProps> = ({
  assessment,
  recommendations,
  studentProfileId,
  onRetake,
  retakeLocked = false,
  onTakeAptitude,
  isLoading,
  isGeneratingResults = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMajor, setSelectedMajor] = useState<number | null>(null);

  // Compute derived values with defensive null checks
  const derivedData = useMemo(() => {
    if (!assessment || !recommendations) return null;

    const recs = Array.isArray(recommendations.recommendations) ? recommendations.recommendations : [];
    const topMajors = recs
      .filter((rec) => rec && rec.majorName && rec.fitBreakdown)
      .slice(0, 5);

    const aptitudeTaken = assessment.aptitudeScores != null;
    const hasSTEMMajors = topMajors.some((rec) =>
      ['Engineering', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Data Science', 'Medicine'].some(
        (stem) => (rec?.majorName || '').includes(stem)
      )
    );

    // Calculate confidence level
    let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
    const confidenceScore = recommendations.confidenceScore ?? 70;
    if (confidenceScore >= 80) confidenceLevel = 'high';
    else if (confidenceScore >= 60) confidenceLevel = 'medium';
    else confidenceLevel = 'low';

    return {
      aptitudeTaken,
      topMajors,
      hasSTEMMajors,
      confidenceLevel,
      confidenceScore,
    };
  }, [assessment, recommendations]);

  if (isLoading) {
    return (
      <div className="majormatch-results">
        <div className="majormatch-results__loading">
          <div className="majormatch-results__spinner" />
          <div>
            <h4 className="majormatch-results__loading-title">
              {isGeneratingResults ? 'Analyzing Your Results...' : 'Loading Your Results...'}
            </h4>
            <p className="majormatch-results__loading-text">
              {isGeneratingResults
                ? t('studentHub.psychometric.results.generatingInsights', 'Our AI is generating personalized insights and recommendations')
                : t('studentHub.psychometric.results.fetchingData', 'Fetching your assessment data and recommendations')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment || !recommendations || !derivedData) {
    return (
      <div className="majormatch-results">
        <div className="majormatch-results__notice">
          <h4 className="majormatch-results__notice-title">
            <Info size={16} />
            {t('studentHub.psychometric.results.noResultsAvailable', 'No Results Available')}
          </h4>
          <p className="majormatch-results__notice-text">
            {t('studentHub.psychometric.results.noResultsDescription', 'Assessment results are not available. Please complete an assessment first.')}
          </p>
        </div>
      </div>
    );
  }

  const topRecommendations = derivedData.topMajors;

  // RIASEC letters → plain-language profile descriptor for the verdict.
  const riasecLetters = (assessment.riasecCode || '')
    .split(/[- ]/)
    .map((l) => l.trim().toUpperCase())
    .filter(Boolean);
  const profileAdjectives = riasecLetters.map((L) => RIASEC_ADJECTIVES[L]).filter(Boolean);
  const profileDescriptor =
    profileAdjectives.length >= 2
      ? `${profileAdjectives.slice(0, -1).join(', ')}, and ${profileAdjectives[profileAdjectives.length - 1]}`
      : profileAdjectives.join('');

  // One-line, plain-English takeaway above each Overview chart, derived from
  // the real scores so the charts aren't left to speak for themselves.
  const prettify = (s: string) =>
    s.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

  const topInterestFull = riasecLetters[0] ? RIASEC_DESCRIPTIONS[riasecLetters[0]]?.full : undefined;
  const interestsTakeaway = topInterestFull
    ? t('studentHub.psychometric.results.takeawayInterests', 'Your strongest interest is {{type}} work.', { type: topInterestFull })
    : '';

  const topValue = recommendations.assessmentSummary?.topValues?.[0]?.value;
  const valuesTakeaway = topValue
    ? t('studentHub.psychometric.results.takeawayValues', 'What drives you most: {{value}}.', { value: prettify(topValue) })
    : '';

  const bf = assessment.bigFiveScores;
  const personalityTakeaway = (() => {
    if (!bf) return '';
    const traits: { label: string; value: number }[] = [
      { label: 'openness to new experiences', value: bf.openness },
      { label: 'being organized and disciplined', value: bf.conscientiousness },
      { label: 'being outgoing and energetic', value: bf.extraversion },
      { label: 'being cooperative and warm', value: bf.agreeableness },
      { label: 'staying calm under pressure', value: 100 - (bf.neuroticism ?? 0) },
    ].sort((a, b) => b.value - a.value);
    return t('studentHub.psychometric.results.takeawayPersonality', 'You stand out most for {{trait}}.', { trait: traits[0].label });
  })();

  const topMajorName = topRecommendations[0]?.majorName;

  const TABS: { key: string; label: string; Icon: typeof Compass }[] = [
    { key: 'overview', label: t('studentHub.psychometric.results.overview', 'Overview'), Icon: Compass },
    { key: 'majors', label: t('studentHub.psychometric.results.majorRecommendations', 'Major Recommendations'), Icon: Star },
    { key: 'universities', label: t('studentHub.psychometric.results.universities', 'Universities'), Icon: Globe },
  ];

  const matchTier = (score: number) => (score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low');

  return (
    <div className="majormatch-results">
      {/* Answer-first verdict banner — lead with the majors, not the jargon. */}
      <header className="majormatch-results__banner">
        <div className="majormatch-results__banner-main">
          <div className="majormatch-results__eyebrow">
            {t('studentHub.psychometric.results.eyebrow', 'AI Major Match · Results')}
          </div>
          <h2 className="majormatch-results__banner-title">
            {t('studentHub.psychometric.results.bestFitMajors', 'Your best-fit majors')}
          </h2>
          <p className="majormatch-results__banner-sub">
            {profileDescriptor
              ? t(
                  'studentHub.psychometric.results.profileLede',
                  'Your answers point to a {{descriptor}} profile. Based on that, these majors fit you best:',
                  { descriptor: profileDescriptor },
                )
              : t(
                  'studentHub.psychometric.results.profileLedeFallback',
                  'Based on your answers, these majors fit you best:',
                )}
          </p>

          {topRecommendations.length > 0 && (
            <div className="majormatch-results__verdict">
              {topRecommendations.slice(0, 3).map((rec, i) => (
                <button
                  key={i}
                  type="button"
                  className="majormatch-results__verdict-card"
                  onClick={() => setActiveTab('majors')}
                >
                  <span className="majormatch-results__verdict-rank">{i + 1}</span>
                  <span className="majormatch-results__verdict-text">
                    <span className="majormatch-results__verdict-name">{rec.majorName}</span>
                    <span
                      className={`majormatch-results__verdict-score majormatch-results__verdict-score--${matchTier(rec.fitScore ?? 0)}`}
                    >
                      {(rec.fitScore ?? 0).toFixed(0)}% {t('studentHub.psychometric.results.match', 'match')}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="majormatch-results__code-badge">
          <span className="majormatch-results__code-label">
            {t('studentHub.psychometric.results.yourRiasecCode', 'YOUR RIASEC CODE')}
          </span>
          <span className="majormatch-results__code-value">{assessment.riasecCode}</span>
        </div>
      </header>

      {/* Editorial tab bar */}
      <nav className="majormatch-results__tabs" role="tablist">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            className={`majormatch-results__tab ${activeTab === key ? 'is-active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      {/* Overview tab — the supporting evidence: "what your answers say". */}
      {activeTab === 'overview' && (
        <div>
          {/* Plain-language profile summary (replaces the old jargon-first,
              duplicated RIASEC explainer). */}
          <section className="majormatch-results__panel">
            <div className="majormatch-results__panel-head">
              <Info size={16} />
              <h3 className="majormatch-results__panel-title">
                {t('studentHub.psychometric.results.whatYourAnswersSay', 'What your answers say about you')}
              </h3>
            </div>
            <p className="majormatch-results__panel-lede">
              {profileDescriptor
                ? t(
                    'studentHub.psychometric.results.profileSummary',
                    'You come across as {{descriptor}}. Your three strongest interest areas are below — together they make up your RIASEC code ({{code}}), a shorthand for the majors and careers that tend to fit people like you.',
                    { descriptor: profileDescriptor, code: assessment.riasecCode },
                  )
                : t(
                    'studentHub.psychometric.results.profileSummaryFallback',
                    'Your three strongest interest areas are below — together they make up your RIASEC code ({{code}}), a shorthand for the majors and careers that tend to fit you.',
                    { code: assessment.riasecCode },
                  )}
            </p>
            <div className="majormatch-results__dim-grid">
              {riasecLetters
                .map((L) => {
                  const info = RIASEC_DESCRIPTIONS[L];
                  if (!info) return null;
                  return (
                    <div key={L} className="majormatch-results__dim">
                      <div className="majormatch-results__dim-name">
                        {info.full} ({L})
                      </div>
                      <div className="majormatch-results__dim-desc">{info.description}</div>
                    </div>
                  );
                })}
            </div>
          </section>

          <div className="majormatch-results__grid">
            {/* RIASEC Radar Chart */}
            <div className="majormatch-results__evidence">
              {interestsTakeaway && (
                <p className="majormatch-results__takeaway">{interestsTakeaway}</p>
              )}
              <RiasecRadarChart
                scores={assessment.riasecScores}
                riasecCode={assessment.riasecCode}
                height={350}
              />
            </div>

            {/* Confidence Indicator */}
            <ConfidenceIndicator
              confidenceLevel={derivedData.confidenceLevel}
              confidenceScore={derivedData.confidenceScore}
              aptitudeTaken={derivedData.aptitudeTaken}
              hasSTEMMajors={derivedData.hasSTEMMajors}
              riskFlags={assessment.riskFlags || []}
              academicConfidenceScore={assessment.academicConfidenceScore}
              onBoostAccuracy={onTakeAptitude}
              onAddGrades={() => navigate('/student-hub/profile')}
            />
          </div>

          <div className="majormatch-results__grid-2">
            {/* Values Chart */}
            <div className="majormatch-results__evidence">
              {valuesTakeaway && (
                <p className="majormatch-results__takeaway">{valuesTakeaway}</p>
              )}
              <ValuesChart scores={assessment.valuesScores} variant="horizontal" height={280} />
            </div>

            {/* Big Five Chart */}
            <div className="majormatch-results__evidence">
              {personalityTakeaway && (
                <p className="majormatch-results__takeaway">{personalityTakeaway}</p>
              )}
              <BigFiveChart
                scores={assessment.bigFiveScores}
                workStyleProfile={assessment.workStyleProfile}
                variant="detailed"
              />
            </div>
          </div>
        </div>
      )}

      {/* Major Recommendations tab */}
      {activeTab === 'majors' && (
        <div>
          {topRecommendations.map((rec, index) => (
            <article
              key={index}
              className={`majormatch-results__rec-card ${selectedMajor === index ? 'is-selected' : ''}`}
              onClick={() => setSelectedMajor(selectedMajor === index ? null : index)}
            >
              <div className="majormatch-results__rec-grid">
                <div>
                  <div className="majormatch-results__rec-head">
                    <span
                      className={`majormatch-results__rec-rank ${index < 3 ? '' : 'majormatch-results__rec-rank--muted'}`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="majormatch-results__rec-name">{rec.majorName}</h4>
                      <div className="majormatch-results__rec-pills">
                        <span
                          className={`majormatch-results__match-pill majormatch-results__match-pill--${matchTier(rec.fitScore ?? 0)}`}
                        >
                          {(rec.fitScore ?? 0).toFixed(0)}% {t('studentHub.psychometric.results.match', 'Match')}
                        </span>
                        {rec.explanation?.confidence && (
                          <span className="majormatch-results__tag majormatch-results__tag--brand">
                            {rec.explanation.confidence} {t('studentHub.psychometric.results.confidence', 'Confidence')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {rec.explanation?.whyFits && (
                    <p className="majormatch-results__rec-body">{rec.explanation.whyFits}</p>
                  )}

                  {(rec.explanation?.majorOverview || rec.majorProfile?.description) && (
                    <p className="majormatch-results__rec-overview">
                      {rec.explanation?.majorOverview || rec.majorProfile?.description}
                    </p>
                  )}

                  {Array.isArray(rec.explanation?.keyContributors) && rec.explanation.keyContributors.length > 0 && (
                    <div className="majormatch-results__rec-block">
                      <span className="majormatch-results__rec-block-label">
                        {t('studentHub.psychometric.results.keyContributors', 'Key Contributors:')}
                      </span>
                      <div className="majormatch-results__rec-pills">
                        {rec.explanation.keyContributors.map((contributor, i) => (
                          <span key={i} className="majormatch-results__tag">
                            {typeof contributor === 'string' ? contributor : String(contributor)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {rec.explanation?.academicFeasibility && (
                    <div className="majormatch-results__rec-block">
                      <span className="majormatch-results__rec-block-label">
                        {t('studentHub.psychometric.results.academicFeasibility', 'Academic Feasibility:')}
                      </span>
                      <div className="majormatch-results__rec-feasibility">{rec.explanation.academicFeasibility}</div>
                    </div>
                  )}

                  {Array.isArray(rec.explanation?.nextSteps) && rec.explanation.nextSteps.length > 0 && (
                    <div className="majormatch-results__rec-block major-next-steps">
                      <span className="majormatch-results__rec-block-label">
                        {t('studentHub.psychometric.results.nextSteps', 'Next Steps:')}
                      </span>
                      <ul className="majormatch-results__steps">
                        {rec.explanation.nextSteps.map((step, i) => (
                          <li key={i}>{typeof step === 'string' ? step : String(step)}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Career paths (always shown for all majors) */}
                  {rec.majorProfile && (
                    <CareerPathCard
                      majorName={rec.majorName}
                      careers={rec.majorProfile.relatedCareers || []}
                      relatedMajors={rec.majorProfile.relatedMajors}
                    />
                  )}
                </div>

                <div>
                  {rec.fitBreakdown && (
                    <div className="majormatch-results__fit">
                      <h5 className="majormatch-results__fit-title">
                        {t('studentHub.psychometric.results.fitBreakdown', 'Fit Breakdown')}
                      </h5>
                      <FitMeter
                        label={t('studentHub.psychometric.results.interest', 'Interest')}
                        value={rec.fitBreakdown.interestFit ?? 0}
                      />
                      <FitMeter
                        label={t('studentHub.psychometric.results.values', 'Values')}
                        value={rec.fitBreakdown.valuesFit ?? 0}
                      />
                      <FitMeter
                        label={t('studentHub.psychometric.results.workStyle', 'Work Style')}
                        value={rec.fitBreakdown.workStyleFit ?? 0}
                      />
                      {/* Academic fit only renders when grades/test data exist
                          — otherwise it's a misleading 0% on every major. */}
                      {(rec.fitBreakdown.academicFit ?? 0) > 0 && (
                        <FitMeter
                          label={t('studentHub.psychometric.results.academic', 'Academic')}
                          value={rec.fitBreakdown.academicFit ?? 0}
                        />
                      )}
                      {(rec.fitBreakdown.aptitudeFit ?? 0) > 0 && (
                        <FitMeter
                          label={t('studentHub.psychometric.results.aptitude', 'Aptitude')}
                          value={rec.fitBreakdown.aptitudeFit ?? 0}
                        />
                      )}
                      <div className="majormatch-results__meter majormatch-results__meter--overall">
                        <div className="majormatch-results__meter-head">
                          <span className="majormatch-results__meter-label">
                            {t('studentHub.psychometric.results.overall', 'Overall')}
                          </span>
                          <span className="majormatch-results__meter-value">
                            {(rec.fitBreakdown.overallFit ?? 0).toFixed(0)}%
                          </span>
                        </div>
                        <div className="majormatch-results__meter-track">
                          <div
                            className="majormatch-results__meter-fill majormatch-results__meter-fill--green"
                            style={{ width: `${Math.max(0, Math.min(100, rec.fitBreakdown.overallFit ?? 0))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Universities tab — AI-generated best-fit universities worldwide
          (Gemini), distinct from the TopCoach directory ("Browse all"). */}
      {activeTab === 'universities' && (
        <UniversityMatches studentProfileId={studentProfileId} maxDisplay={6} />
      )}

      {/* Where to go from here — turn the insight into action (and engagement). */}
      <section className="majormatch-results__next">
        <div className="majormatch-results__next-head">
          <Rocket size={16} />
          <h3 className="majormatch-results__panel-title">
            {t('studentHub.psychometric.results.whereNext', 'Where to go from here')}
          </h3>
        </div>
        <div className="majormatch-results__next-grid">
          <button
            type="button"
            className="majormatch-results__next-card"
            onClick={() => navigate('/mentors')}
          >
            <span className="majormatch-results__next-icon"><Users size={18} /></span>
            <span className="majormatch-results__next-title">
              {t('studentHub.psychometric.results.nextMentor', 'Talk to a mentor')}
            </span>
            <span className="majormatch-results__next-desc">
              {topMajorName
                ? t('studentHub.psychometric.results.nextMentorDescMajor', 'Get advice from someone working in {{major}} and related fields.', { major: topMajorName })
                : t('studentHub.psychometric.results.nextMentorDesc', 'Get advice from someone working in your field.')}
            </span>
            <ArrowRight size={15} className="majormatch-results__next-arrow" />
          </button>

          <button
            type="button"
            className="majormatch-results__next-card"
            onClick={() => setActiveTab('universities')}
          >
            <span className="majormatch-results__next-icon"><Globe size={18} /></span>
            <span className="majormatch-results__next-title">
              {t('studentHub.psychometric.results.nextUniversities', 'Find matching universities')}
            </span>
            <span className="majormatch-results__next-desc">
              {t('studentHub.psychometric.results.nextUniversitiesDesc', 'See universities that offer your recommended majors.')}
            </span>
            <ArrowRight size={15} className="majormatch-results__next-arrow" />
          </button>

          {!derivedData.aptitudeTaken && onTakeAptitude && (
            <button
              type="button"
              className="majormatch-results__next-card"
              onClick={onTakeAptitude}
            >
              <span className="majormatch-results__next-icon"><Zap size={18} /></span>
              <span className="majormatch-results__next-title">
                {t('studentHub.psychometric.results.nextAptitude', 'Sharpen your matches')}
              </span>
              <span className="majormatch-results__next-desc">
                {t('studentHub.psychometric.results.nextAptitudeDesc', 'Take the 10-minute aptitude test for more accurate results.')}
              </span>
              <ArrowRight size={15} className="majormatch-results__next-arrow" />
            </button>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="majormatch-results__actions">
        <button type="button" className="majormatch-results__btn majormatch-results__btn--primary" onClick={onRetake}>
          {retakeLocked ? <Lock size={15} /> : <RotateCcw size={15} />}
          {retakeLocked
            ? t('psychometric.unlockToRetake', 'Unlock to retake')
            : t('psychometric.retakeAssessment', 'Retake Assessment')}
        </button>
        {/* PDF Export temporarily hidden */}
        {/* <PdfExport assessment={assessment} recommendations={recommendations} /> */}
      </div>

    </div>
  );
};

// Editorial fit-breakdown meter: hairline track + brand fill + % label.
const FitMeter: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="majormatch-results__meter">
    <div className="majormatch-results__meter-head">
      <span className="majormatch-results__meter-label">{label}</span>
      <span className="majormatch-results__meter-value">{(value ?? 0).toFixed(0)}%</span>
    </div>
    <div className="majormatch-results__meter-track">
      <div
        className="majormatch-results__meter-fill"
        style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%` }}
      />
    </div>
  </div>
);

export default AssessmentResults;
