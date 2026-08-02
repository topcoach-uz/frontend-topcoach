import React, { useState } from 'react';
import { Modal, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Brain,
  Star,
  Lightbulb,
  PenLine,
  FlaskConical,
  Trash2,
  Lightbulb as LightbulbHint,
  RotateCcw,
  Play,
  Eye,
  Trophy,
  Lock,
} from 'lucide-react';
import type { StudentProfile } from '../../../../app/services/student-hub/types';
import {
  useGetAllAssessmentsQuery,
  useDeleteAssessmentMutation,
} from '../../../../app/services/student-hub/psychometricApi';
import { useCommunityAccessGate } from '../../../../lib/communityAccess';

interface ActiveSessionInfo {
  hasActiveSession: boolean;
  sessionId?: string;
  answeredCount?: number;
  totalCount?: number;
  includeAptitude?: boolean;
  lastUpdated?: string;
}

interface AssessmentStartProps {
  studentProfile: StudentProfile;
  onStart: (language: 'en' | 'uz' | 'ru', includeAptitude: boolean) => void;
  hasExistingAssessment: boolean;
  onViewExisting: (assessmentId: string) => void;
  isLoading: boolean;
  readOnly?: boolean;
  activeSession?: ActiveSessionInfo;
  majorMatchAccessStatus?: {
    canStart: boolean;
    requiresCommunityEnrollment: boolean;
    freeAttemptsRemaining: number;
    promptTitle: string;
    promptMessage: string;
  };
}

/**
 * The five (or six, with aptitude) assessment modules. Defined statically
 * so the component grid stays declarative and easy to scan.
 */
type ModuleSpec = {
  num: string;
  Icon: typeof Compass;
  titleKey: string;
  titleFallback: string;
  descKey: string;
  descFallback: string;
  questions: number;
  minutes: number;
  highlight?: boolean;
};

const CORE_MODULES: ModuleSpec[] = [
  {
    num: '01',
    Icon: Compass,
    titleKey: 'studentHub.psychometric.interestInventory',
    titleFallback: 'Interest Inventory (RIASEC)',
    descKey: 'studentHub.psychometric.interestInventoryDescLong',
    descFallback: '12 forced-choice pairs to identify career interests across six dimensions.',
    questions: 12,
    minutes: 4,
  },
  {
    num: '02',
    Icon: Brain,
    titleKey: 'studentHub.psychometric.personalityProfile',
    titleFallback: 'Personality Profile (Big Five)',
    descKey: 'studentHub.psychometric.personalityProfileDescLong',
    descFallback: '20 statements measuring openness, conscientiousness, extraversion, agreeableness, neuroticism.',
    questions: 20,
    minutes: 5,
  },
  {
    num: '03',
    Icon: Star,
    titleKey: 'studentHub.psychometric.valuesAssessment',
    titleFallback: 'Values Assessment',
    descKey: 'studentHub.psychometric.valuesAssessmentDescLong',
    descFallback: '10 questions on what matters most: stability, autonomy, impact, status, growth.',
    questions: 10,
    minutes: 2,
  },
  {
    num: '04',
    Icon: Lightbulb,
    titleKey: 'studentHub.psychometric.realLifeScenarios',
    titleFallback: 'Real-Life Scenarios (SJT)',
    descKey: 'studentHub.psychometric.realLifeScenariosDescLong',
    descFallback: '4 situational judgment items — how you respond when it counts.',
    questions: 4,
    minutes: 2,
  },
  {
    num: '05',
    Icon: PenLine,
    titleKey: 'studentHub.psychometric.openEndedQuestions',
    titleFallback: 'Open-Ended Questions',
    descKey: 'studentHub.psychometric.openEndedQuestionsDescLong',
    descFallback: '2 reflective prompts for AI-powered personalization. There are no wrong answers.',
    questions: 2,
    minutes: 2,
  },
];

const APTITUDE_MODULE: ModuleSpec = {
  num: '06',
  Icon: FlaskConical,
  titleKey: 'studentHub.psychometric.aptitudeTests',
  titleFallback: 'Aptitude Tests',
  descKey: 'studentHub.psychometric.aptitudeTestsDescLong',
  descFallback: '12 cognitive-ability questions — recommended for STEM majors.',
  questions: 12,
  minutes: 6,
  highlight: true,
};

export const AssessmentStart: React.FC<AssessmentStartProps> = ({
  studentProfile,
  onStart,
  onViewExisting,
  isLoading,
  readOnly = false,
  activeSession,
  majorMatchAccessStatus,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  // Funnel-aware destination for the "Unlock Community" CTA — the gate decides
  // whether to send the user to the profile wizard, roadmap, or the
  // subscription tab based on how far they are through Community enrollment.
  const gate = useCommunityAccessGate();
  const [selectedLanguage] = useState<'en' | 'uz' | 'ru'>(
    (i18n.language.split('-')[0] as 'en' | 'uz' | 'ru') || 'en',
  );
  const [includeAptitude, setIncludeAptitude] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null);

  const { data: allAssessments, isLoading: assessmentsLoading } = useGetAllAssessmentsQuery(
    studentProfile?.id || '',
    { skip: !studentProfile?.id },
  );
  const [deleteAssessment, { isLoading: isDeleting }] = useDeleteAssessmentMutation();

  const handleStart = () => onStart(selectedLanguage, includeAptitude);

  const handleDeleteClick = (assessmentId: string) => {
    setAssessmentToDelete(assessmentId);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assessmentToDelete) return;
    try {
      await deleteAssessment(assessmentToDelete).unwrap();
      message.success('Assessment deleted successfully');
      setDeleteModalVisible(false);
      setAssessmentToDelete(null);
    } catch (error: any) {
      message.error(error?.data?.message || 'Failed to delete assessment');
    }
  };

  const totalQuestions = 48 + (includeAptitude ? 12 : 0);
  const estimatedTime = includeAptitude ? '18–22' : '12–15';

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatLastSaved = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const modules = includeAptitude ? [...CORE_MODULES, APTITUDE_MODULE] : CORE_MODULES;
  const hasActive = !!activeSession?.hasActiveSession;
  // Free-attempt limit reached and not Community-enrolled — show the upsell
  // path instead of a dead-end disabled button.
  const requiresEnrollment = !readOnly && !!majorMatchAccessStatus?.requiresCommunityEnrollment;
  const handleUnlock = () => navigate(gate.destination);

  return (
    <div className="majormatch">
      {/* Hero ───────────────────────────────────────────────────────
          Pitch copy, and a pitch only lands on the person deciding whether to
          take the test. Counselors are here to read a result, so read-only
          skips the hero entirely — PsychometricAssessmentPage renders a short
          title + one line of context above this instead. */}
      {!readOnly && (
      <header className="majormatch__hero">
        <div className="majormatch__hero-text">
          <div className="majormatch__eyebrow">AI Major Match · Psychometric Assessment</div>
          <h1 className="majormatch__title">
            {t(
              'studentHub.psychometric.editorialTitle',
              'Find the major that fits — not the one that sounds good.',
            )}
          </h1>
          <p className="majormatch__lede">
            {t(
              'studentHub.psychometric.editorialLede',
              'A 48-question psychometric battery covering interests, personality, values, and aptitudes. Built on RIASEC, Big Five, and SJT methodology.',
            )}
          </p>
        </div>
        {!readOnly && (
          <div className="majormatch__hero-cta">
            {requiresEnrollment ? (
              <>
                <button
                  type="button"
                  className="majormatch__btn majormatch__btn--primary"
                  onClick={handleUnlock}
                >
                  <Lock size={14} />
                  {t('studentHub.psychometric.unlockUnlimited', 'Unlock unlimited matches')}
                </button>
                <div className="majormatch__cta-meta majormatch__cta-meta--unlock">
                  {t(
                    'studentHub.psychometric.freeAttemptUsedNote',
                    "You've used your 1 free attempt. Subscribe to Community for unlimited matches.",
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="majormatch__btn majormatch__btn--primary"
                  onClick={handleStart}
                  disabled={isLoading}
                >
                  {hasActive ? <RotateCcw size={14} /> : <Play size={14} />}
                  {hasActive
                    ? t('studentHub.psychometric.resume', 'Resume ({{answered}}/{{total}})', {
                        answered: activeSession?.answeredCount ?? 0,
                        total: activeSession?.totalCount ?? 48,
                      })
                    : t('studentHub.psychometric.startAssessment', 'Start Assessment')}
                </button>
                {hasActive && activeSession?.lastUpdated && (
                  <div className="majormatch__cta-meta">
                    {t('studentHub.psychometric.lastSaved', 'Last saved')}{' · '}
                    {formatLastSaved(activeSession.lastUpdated)}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </header>
      )}

      {/* The "free attempt used" state is now conveyed by the small note
          under the hero "Unlock unlimited matches" button — the large
          feature-list upsell card that used to sit here was redundant. */}

      {/* Stats strip ───────────────────────────────────────────────
          Describes the test as a product (length, frameworks, "Not started").
          That's pre-purchase framing for a student deciding to start; a
          counselor reading a finished result doesn't need the spec sheet. */}
      {!readOnly && (
      <section className="majormatch__stats">
        <div className="majormatch__stat">
          <div className="majormatch__stat-label">Questions</div>
          <div className="majormatch__stat-value">{totalQuestions}</div>
          <div className="majormatch__stat-foot">across 5 components</div>
        </div>
        <div className="majormatch__stat">
          <div className="majormatch__stat-label">Time</div>
          <div className="majormatch__stat-value">{estimatedTime}</div>
          <div className="majormatch__stat-foot">minutes</div>
        </div>
        <div className="majormatch__stat">
          <div className="majormatch__stat-label">Frameworks</div>
          <div className="majormatch__stat-value">4</div>
          <div className="majormatch__stat-foot">RIASEC · Big Five · SJT · Values</div>
        </div>
        <div className="majormatch__stat">
          <div className="majormatch__stat-label">Output</div>
          <div className="majormatch__stat-value">
            <span className="majormatch__stat-infinity">∞</span>
          </div>
          <div className="majormatch__stat-foot">major + career match</div>
        </div>
      </section>
      )}

      {/* Read-only empty/loading state. Every other block on this step is
          gated behind !readOnly, so without this a counselor viewing a student
          who hasn't taken the assessment gets a blank tab. */}
      {readOnly && assessmentsLoading && (
        <div className="majormatch__history-loading">
          {t('common.loading', 'Loading…')}
        </div>
      )}
      {readOnly && !assessmentsLoading && (!allAssessments || allAssessments.length === 0) && (
        <div className="majormatch__empty">
          <Compass size={18} />
          <p className="majormatch__empty-text">
            {t(
              'studentHub.psychometric.counselorEmpty',
              "This student hasn't completed the AI Major Match assessment yet.",
            )}
          </p>
        </div>
      )}

      {/* History (only if there are completed assessments) ───────── */}
      {allAssessments && allAssessments.length > 0 && (
        <section className="majormatch__section">
          <div className="majormatch__section-head">
            <Trophy size={16} />
            <h2 className="majormatch__section-title">
              {t('studentHub.psychometric.assessmentHistory', 'Assessment history')} (
              {allAssessments.length})
            </h2>
          </div>
          <ul className="majormatch__history">
            {assessmentsLoading && <li className="majormatch__history-loading">Loading…</li>}
            {!assessmentsLoading &&
              allAssessments.map((assessment, idx) => (
                <li key={assessment.id} className="majormatch__history-row">
                  <div className="majormatch__history-main">
                    <div className="majormatch__history-title">
                      {t('studentHub.psychometric.assessment', 'Assessment')} #{idx + 1}
                      <span
                        className={`majormatch__pill ${
                          assessment.aptitudeScores
                            ? 'majormatch__pill--green'
                            : 'majormatch__pill--blue'
                        }`}
                      >
                        {assessment.aptitudeScores
                          ? t('studentHub.psychometric.withAptitude', 'With Aptitude')
                          : t('studentHub.psychometric.coreOnly', 'Core Only')}
                      </span>
                    </div>
                    <div className="majormatch__history-meta">
                      {t('studentHub.psychometric.completed', 'Completed')}:{' '}
                      {formatDate(
                        assessment.assessmentMetadata?.completedAt || assessment.createdAt,
                      )}
                    </div>
                    <div className="majormatch__history-meta">
                      {t('studentHub.psychometric.riasecCode', 'RIASEC code')}:{' '}
                      <strong className="majormatch__history-code">{assessment.riasecCode}</strong>
                      {' · '}
                      {assessment.assessmentMetadata?.questionCount || '—'}{' '}
                      {t('studentHub.psychometric.questions', 'questions')}
                      {' · '}
                      {Math.round((assessment.assessmentMetadata?.completionTime || 0) / 60)}{' '}
                      {t('common.minutes', 'min')}
                    </div>
                  </div>
                  <div className="majormatch__history-actions">
                    <button
                      type="button"
                      className="majormatch__link"
                      onClick={() => onViewExisting(assessment.id)}
                    >
                      <Eye size={13} /> {t('studentHub.psychometric.viewResults', 'View results')}
                    </button>
                    {!readOnly && (
                      <button
                        type="button"
                        className="majormatch__link majormatch__link--danger"
                        onClick={() => handleDeleteClick(assessment.id)}
                      >
                        <Trash2 size={13} /> {t('common.delete', 'Delete')}
                      </button>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}

      {/* Components grid ─────────────────────────────────────────── */}
      {!readOnly && (
        <section className="majormatch__section">
          <div className="majormatch__section-head majormatch__section-head--row">
            <h2 className="majormatch__section-title">
              {t('studentHub.psychometric.assessmentComponents', 'Assessment components')}
            </h2>
            <span className="majormatch__section-meta">
              {modules.length} modules · take in any order
            </span>
          </div>
          <div className="majormatch__modules">
            {modules.map(({ num, Icon, titleKey, titleFallback, descKey, descFallback, questions, minutes, highlight }) => (
              <article
                key={num}
                className={`majormatch__module ${highlight ? 'majormatch__module--highlight' : ''}`}
              >
                <div className="majormatch__module-head">
                  <span className="majormatch__module-num">{num}</span>
                  <span className="majormatch__module-icon">
                    <Icon size={16} />
                  </span>
                  <span className="majormatch__module-time">{minutes} min</span>
                </div>
                <h3 className="majormatch__module-title">{t(titleKey, titleFallback)}</h3>
                <p className="majormatch__module-desc">{t(descKey, descFallback)}</p>
                <div className="majormatch__module-foot">
                  <span className="majormatch__module-count">{questions} questions</span>
                  <span className="majormatch__module-status">Not started</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Settings ────────────────────────────────────────────────── */}
      {!readOnly && (
        <section className="majormatch__section majormatch__section--settings">
          <div className="majormatch__section-head">
            <h2 className="majormatch__section-title">
              {t('studentHub.psychometric.assessmentSettings', 'Assessment settings')}
            </h2>
          </div>

          <div className="majormatch__setting">
            <div className="majormatch__setting-text">
              <div className="majormatch__setting-label">
                {t('studentHub.psychometric.includeAptitudeTests', 'Include aptitude tests')}
              </div>
              <div className="majormatch__setting-desc">
                {t(
                  'studentHub.psychometric.includeAptitudeTestsDesc',
                  'Get deeper insights with cognitive ability assessment (+12 questions)',
                )}
              </div>
            </div>
            <div className="majormatch__toggle" role="radiogroup" aria-label="Include aptitude">
              <button
                type="button"
                role="radio"
                aria-checked={includeAptitude}
                className={`majormatch__toggle-btn ${
                  includeAptitude ? 'is-active' : ''
                }`}
                onClick={() => setIncludeAptitude(true)}
              >
                {t('studentHub.psychometric.yesInclude', 'Yes, include')}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={!includeAptitude}
                className={`majormatch__toggle-btn ${
                  !includeAptitude ? 'is-active' : ''
                }`}
                onClick={() => setIncludeAptitude(false)}
              >
                {t('studentHub.psychometric.noSkip', 'No, skip')}
              </button>
            </div>
          </div>

          <div className="majormatch__hint">
            <LightbulbHint size={14} />
            <span>
              {t('studentHub.psychometric.recommendedForStem', 'Recommended for STEM majors')}
            </span>
          </div>
        </section>
      )}

      <Modal
        title={t('studentHub.psychometric.deleteAssessment', 'Delete Assessment')}
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalVisible(false);
          setAssessmentToDelete(null);
        }}
        confirmLoading={isDeleting}
        okText={t('common.delete', 'Delete')}
        okButtonProps={{ danger: true }}
        cancelText={t('common.cancel', 'Cancel')}
      >
        <p>
          {t(
            'studentHub.psychometric.deleteConfirm',
            'Are you sure you want to delete this assessment? This action cannot be undone.',
          )}
        </p>
        <p style={{ color: '#7B1F2F', fontWeight: 500 }}>
          {t(
            'studentHub.psychometric.deleteWarning',
            'All assessment data, scores, and recommendations will be permanently removed.',
          )}
        </p>
      </Modal>
    </div>
  );
};
