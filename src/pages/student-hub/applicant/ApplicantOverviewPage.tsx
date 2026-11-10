import { useEffect, useState } from 'react';
import { Alert, Button, Skeleton } from 'antd';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useGetLatestMm3ReportQuery,
  useGetMajorMatchStatusQuery,
} from 'src/app/services/student-hub/majorMatchApi';
import type {
  ApplicantOverview,
  OverviewApplication,
} from 'src/app/services/student-hub/applicantOverviewApi';
import {
  applicantLinks,
  applicationWorkspaceLink,
} from 'src/lib/applicantWorkspace';
import { useApplicantOverview } from './ApplicantOverviewContext';
import {
  applicantDegreeOrNull,
  assessmentState,
  displayName,
  hasAssessmentDraft,
  overviewVisit,
  safeMeetingLink,
} from './applicantOverviewModel';
import { getTranslation } from 'src/lib/i18n/translationUtils';
import { useGetMySessionsQuery } from 'src/app/services/sessions';
import { useTypedSelector } from 'src/app/store';
import {
  mentorName,
  needsRating,
  splitSessions,
  unwrapSessions,
} from './studentSessionsModel';

const TextLink = ({
  to,
  children,
  primary = false,
}: {
  to: string;
  children: React.ReactNode;
  primary?: boolean;
}) => (
  <Link
    className={primary ? 'applicant-button' : 'applicant-text-link'}
    to={to}
  >
    {children}
    <ArrowRight size={16} aria-hidden />
  </Link>
);

export default function ApplicantOverviewPage() {
  const {
    currentData: data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useApplicantOverview();
  const { t, i18n } = useTranslation();
  const [online, setOnline] = useState(() => navigator.onLine);
  const [applicationTab, setApplicationTab] = useState<'active' | 'shortlist'>(
    'active',
  );
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  useEffect(() => {
    const previous = document.title;
    document.title = t('applicant.pageTitle', 'Overview · TopCoach');
    return () => {
      document.title = previous;
    };
  }, [t]);
  const authUserId = useTypedSelector((state) => state.auth.profile?.id);
  const mySessions = useGetMySessionsQuery(undefined, {
    skip: !authUserId,
    refetchOnMountOrArgChange: true,
  });
  const unratedSession = splitSessions(unwrapSessions(mySessions.data)).past.find((session) =>
    needsRating(session, authUserId),
  );
  const profile = data?.profile;
  const degree = applicantDegreeOrNull(profile?.targetDegree);
  const needsAssessment = degree === 'bachelor' && !!profile?.id;
  const status = useGetMajorMatchStatusQuery(profile?.id ?? '', {
    skip: !needsAssessment,
    refetchOnMountOrArgChange: true,
  });
  const latest = useGetLatestMm3ReportQuery(profile?.id ?? '', {
    skip: !needsAssessment,
    refetchOnMountOrArgChange: true,
  });
  let draft = false;
  try {
    draft =
      needsAssessment &&
      hasAssessmentDraft(
        localStorage.getItem(`topcoach_mm3_draft_${profile?.id}`),
      );
  } catch {
    /* Storage may be unavailable. */
  }
  const assessment = assessmentState({
    loading:
      status.isLoading ||
      (status.isFetching && !status.currentData) ||
      (status.currentData?.hasCompletedMm3 !== true &&
        (latest.isLoading ||
          (latest.isFetching && latest.currentData === undefined))),
    error:
      status.isError ||
      (status.currentData?.hasCompletedMm3 !== true && latest.isError),
    status: status.currentData,
    hasReport: !!latest.currentData,
    hasDraft: draft,
  });
  const retry = () => {
    void refetch();
    if (needsAssessment) {
      void status.refetch();
      void latest.refetch();
    }
  };
  const retryAssessment = () => {
    void status.refetch();
    void latest.refetch();
  };
  const sectionError = () => (
    <div className="applicant-section-error" role="status">
      <p>{t('applicant.sectionError')}</p>
      <Button onClick={retry} loading={isFetching}>
        {t('applicant.retry')}
      </Button>
    </div>
  );
  const date = (value: string | null, withTime = false) => {
    if (!value || !Number.isFinite(new Date(value).getTime()))
      return t('applicant.noDate');
    return new Intl.DateTimeFormat(i18n.language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...(withTime ? ({ hour: '2-digit', minute: '2-digit' } as const) : {}),
    }).format(new Date(value));
  };

  if (isLoading || (!data && !isError))
    return (
      <div
        className="applicant-overview"
        aria-busy="true"
        role="status"
        aria-label={t('applicant.loading')}
      >
        <p className="applicant-muted">{t('applicant.loading')}</p>
        <header className="applicant-page-heading">
          <div style={{ flex: 1 }}>
            <Skeleton
              active
              title={{ width: '40%' }}
              paragraph={{ rows: 1, width: '55%' }}
            />
          </div>
        </header>
        <div className="applicant-card applicant-loading-card">
          <Skeleton active paragraph={{ rows: 5 }} />
        </div>
        <div className="applicant-columns">
          <div className="applicant-stack">
            <div className="applicant-card">
              <Skeleton active paragraph={{ rows: 6 }} />
            </div>
            <div className="applicant-card">
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
          </div>
          <div className="applicant-stack">
            <div className="applicant-card">
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
            <div className="applicant-card">
              <Skeleton active paragraph={{ rows: 5 }} />
            </div>
          </div>
        </div>
      </div>
    );
  if (!data)
    return (
      <div className="applicant-card applicant-page-error" role="alert">
        <h1>
          {t(online ? 'applicant.loadErrorTitle' : 'applicant.offlineTitle')}
        </h1>
        <p>{t(online ? 'applicant.loadErrorBody' : 'applicant.offlineBody')}</p>
        <Button type="primary" onClick={retry} loading={isFetching}>
          {t('applicant.retry')}
        </Button>
      </div>
    );

  const visit = overviewVisit(data);
  const returning =
    visit === 'returning' ||
    (needsAssessment && (assessment === 'complete' || assessment === 'draft'));
  const firstName = displayName(profile?.name).split(' ')[0];
  const welcomeKey = returning ? 'applicant.welcomeBack' : 'applicant.welcome';
  const greeting = firstName
    ? t(`${welcomeKey}Name`, { name: firstName })
    : t(welcomeKey);
  const apps =
    data.applications.state === 'ready' ? data.applications.data : null;
  const tasks = data.tasks.state === 'ready' ? data.tasks.data : null;
  const sessions = data.sessions.state === 'ready' ? data.sessions.data : null;
  const next = sessions?.next;
  const nextDeadline = apps?.nextDeadline;
  const currentApplications = apps?.[applicationTab];
  const completion = profile
    ? Math.max(0, Math.min(100, profile.completionPercentage))
    : null;
  const intake = profile?.intakeYear
    ? [
        profile.intakeTerm &&
          t(`applicant.term.${profile.intakeTerm}`, profile.intakeTerm),
        profile.intakeYear,
      ]
        .filter(Boolean)
        .join(' ')
    : t('applicant.notSet');
  const studyFields =
    degree === 'master'
      ? [
          ['previousDegree', profile?.previousDegree],
          ['previousInstitution', profile?.previousInstitution],
          ['previousField', profile?.previousField],
        ]
      : degree === 'bachelor'
        ? [['currentSchool', profile?.currentSchool]]
        : [];
  const matchedMajors = latest.currentData?.majors
    ?.map((major) => major.name?.trim())
    .filter((name): name is string => !!name)
    .slice(0, 3) ?? [];
  const hasViewableReport = !!latest.currentData || !!status.currentData?.latest;
  const applicationCard = (app: OverviewApplication) => (
    <article className="applicant-card applicant-application" key={app.id}>
      <h3>{getTranslation(app.major) || t('applicant.fieldNotSet')}</h3>
      <p className="applicant-muted">
        {getTranslation(app.universityName) || t('applicant.universityNotSet')}
      </p>
      {app.degreeLevel && (
        <small>{t(`applicant.${app.degreeLevel}Degree`)}</small>
      )}
      <span className="applicant-status">
        {t(`applicant.status.${app.status}`, t('applicant.statusUnknown'))}
      </span>
      {app.deadline && (
        <small>{t('applicant.deadline', { date: date(app.deadline) })}</small>
      )}
      <TextLink to={applicationWorkspaceLink(app.id)}>
        {t('applicant.openApplication')}
      </TextLink>
    </article>
  );

  return (
    <div
      className="applicant-overview"
      data-degree={degree ?? 'unknown'}
      data-visit={visit}
    >
      {!online && (
        <Alert
          type="warning"
          showIcon
          message={t('applicant.offlineTitle')}
          description={t('applicant.offlineBody')}
        />
      )}
      {isError && (
        <Alert
          type="warning"
          showIcon
          message={t('applicant.refreshError')}
          action={
            <Button onClick={retry} loading={isFetching}>
              {t('applicant.retry')}
            </Button>
          }
        />
      )}
      <header className="applicant-page-heading">
        <div>
          <h1>{greeting}</h1>
          <p>
            {t(
              degree === 'bachelor'
                ? 'applicant.bachelorWorkspaceLabel'
                : degree
                  ? `applicant.${degree}Workspace`
                  : 'applicant.workspaceSubtitle',
            )}
          </p>
        </div>
        <Button
          type="text"
          aria-label={t('applicant.refresh')}
          title={t('applicant.refresh')}
          loading={isFetching}
          onClick={retry}
          icon={<RefreshCw size={18} aria-hidden />}
        />
      </header>
      {!degree && (
        <section className="applicant-card applicant-goal-prompt">
          <h2>
            {t(profile ? 'applicant.chooseGoal' : 'applicant.profileMissing')}
          </h2>
          <p>
            {t(
              profile
                ? 'applicant.chooseGoalBody'
                : 'applicant.profileMissingBody',
            )}
          </p>
          <TextLink to={applicantLinks.profile} primary>
            {t('applicant.reviewProfile')}
          </TextLink>
        </section>
      )}

      {needsAssessment && (
        <section
          className={`applicant-major-match${assessment === 'complete' ? ' applicant-major-match--complete' : ''}`}
          aria-label={t('applicant.majorMatch')}
        >
          <div>
            <p className="applicant-eyebrow">{t('applicant.majorMatch')}</p>
            {assessment === 'loading' ? (
              <div role="status">
                <p>{t('applicant.assessmentLoading')}</p>
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            ) : assessment === 'error' ? (
              <>
                <h2>{t('applicant.assessmentError')}</h2>
                <p>{t('applicant.sectionError')}</p>
                <Button
                  onClick={retryAssessment}
                  loading={status.isFetching || latest.isFetching}
                >
                  {t('applicant.retry')}
                </Button>
              </>
            ) : assessment === 'complete' ? (
              <>
                <h2>{t(hasViewableReport
                  ? 'applicant.assessment.complete.title'
                  : 'applicant.assessment.complete.noReportTitle')}</h2>
                <p>{t(hasViewableReport
                  ? 'applicant.assessment.complete.body'
                  : 'applicant.assessment.complete.noReportBody')}</p>
                <div className="applicant-major-match__actions">
                  <TextLink primary to={applicantLinks.universities}>
                    {t('applicant.assessment.complete.nextAction')}
                  </TextLink>
                  <TextLink
                    to={hasViewableReport
                      ? `${applicantLinks.majorMatch}?step=results`
                      : applicantLinks.personal}
                  >
                    {hasViewableReport
                      ? t('applicant.assessment.complete.reportAction')
                      : t('applicant.reviewGoals')}
                  </TextLink>
                </div>
              </>
            ) : (
              <>
                <h2>{t(`applicant.assessment.${assessment}.title`)}</h2>
                <p>{t(`applicant.assessment.${assessment}.body`)}</p>
                <TextLink
                  primary
                  to={applicantLinks.majorMatch}
                >
                  {t(`applicant.assessment.${assessment}.action`)}
                </TextLink>
              </>
            )}
          </div>
          {assessment === 'complete' ? (
            <div className="applicant-major-match__summary">
              <p className="applicant-eyebrow applicant-major-match__summary-label">
                {t('applicant.assessment.complete.summaryTitle')}
              </p>
              {latest.isFetching && latest.currentData === undefined ? (
                <Skeleton active title={false} paragraph={{ rows: 3 }} />
              ) : matchedMajors.length > 0 ? (
                <ol>
                  {matchedMajors.map((major) => <li key={major}>{major}</li>)}
                </ol>
              ) : (
                <p>{t('applicant.assessment.complete.summaryFallback')}</p>
              )}
              {latest.currentData?.meta?.generatedAt && (
                <small>
                  {t('applicant.assessment.complete.updated', {
                    date: date(latest.currentData.meta.generatedAt),
                  })}
                </small>
              )}
            </div>
          ) : (
            <div className="applicant-video">
              <iframe
                src="https://www.youtube-nocookie.com/embed/0ntdgdT3JCs?rel=0"
                title={t('applicant.watchIntroduction')}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          )}
        </section>
      )}

      {degree === 'bachelor' && visit === 'new' && assessment === 'new' && (
        <section
          className="applicant-first-steps"
          aria-labelledby="applicant-steps-title"
        >
          <h2 id="applicant-steps-title">{t('applicant.firstSteps')}</h2>
          <div>
            {[
              ['direction', applicantLinks.personal],
              ['documents', applicantLinks.documents],
              ['shortlist', applicantLinks.applications],
            ].map(([key, to], index) => (
              <article className="applicant-card" key={key}>
                <h3>
                  {index + 1} · {t(`applicant.step.${key}.title`)}
                </h3>
                <p>{t(`applicant.step.${key}.body`)}</p>
                <TextLink to={to}>{t(`applicant.step.${key}.action`)}</TextLink>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="applicant-columns">
        <div className="applicant-stack">
          {degree === 'master' &&
            (visit === 'new' ||
              (visit === 'returning' &&
                !!apps &&
                apps.active.total === 0 &&
                apps.shortlist.total === 0)) && (
            <section className="applicant-card applicant-master-start">
              <p className="applicant-eyebrow">{t('applicant.nextStep')}</p>
              <h2>{t('applicant.masterStartTitle')}</h2>
              <p>{t('applicant.masterStartBody')}</p>
              <TextLink primary to={applicantLinks.newApplication}>
                {t('applicant.startShortlist')}
              </TextLink>
            </section>
          )}

          <section
            className="applicant-applications"
            aria-labelledby="applicant-applications-title"
          >
            <div className="applicant-section-heading">
              <h2 id="applicant-applications-title">
                {t('applicant.yourApplications')}
              </h2>
              <TextLink to={applicantLinks.applications}>
                {t('applicant.viewAll')}
              </TextLink>
            </div>
            {!apps ? (
              sectionError()
            ) : (
              <>
                <div
                  className="applicant-tabs"
                  role="group"
                  aria-label={t('applicant.applicationView')}
                >
                  {(['active', 'shortlist'] as const).map((tab) => (
                    <button
                      type="button"
                      key={tab}
                      aria-pressed={applicationTab === tab}
                      className={applicationTab === tab ? 'is-active' : ''}
                      onClick={() => setApplicationTab(tab)}
                    >
                      {t(`applicant.${tab}`)} <span>{apps[tab].total}</span>
                    </button>
                  ))}
                </div>
                {currentApplications?.items.length ? (
                  <div className="applicant-application-grid">
                    {currentApplications.items.map(applicationCard)}
                  </div>
                ) : (
                  <div className="applicant-card applicant-empty">
                    <h3>{t(`applicant.empty.${applicationTab}.title`)}</h3>
                    <p>{t(`applicant.empty.${applicationTab}.body`)}</p>
                    <TextLink to={applicantLinks.newApplication}>
                      {t('applicant.addApplication')}
                    </TextLink>
                  </div>
                )}
              </>
            )}
          </section>

          <section
            className="applicant-card"
            aria-labelledby="applicant-tasks-title"
          >
            <div className="applicant-section-heading">
              <h2 id="applicant-tasks-title">{t('applicant.upcomingTasks')}</h2>
              {tasks && (
                <span className="applicant-muted">
                  {t('applicant.openTasks', { count: tasks.open })}
                </span>
              )}
            </div>
            {!tasks ? (
              sectionError()
            ) : tasks.items.length ? (
              <ul className="applicant-task-list">
                {tasks.items.map((task) => (
                  <li key={task.id}>
                    <div>
                      {task.applicationId ? (
                        <Link to={applicationWorkspaceLink(task.applicationId)}>
                          {task.title}
                        </Link>
                      ) : (
                        <span>{task.title}</span>
                      )}
                      <small
                        className={
                          task.dueDate &&
                          new Date(task.dueDate).getTime() < Date.now()
                            ? 'applicant-overdue'
                            : 'applicant-muted'
                        }
                      >
                        {task.dueDate &&
                        new Date(task.dueDate).getTime() < Date.now()
                          ? t('applicant.overdue')
                          : t(
                              `applicant.taskStatus.${task.status}`,
                              t('applicant.task'),
                            )}
                      </small>
                    </div>
                    <time dateTime={task.dueDate ?? undefined}>
                      {date(task.dueDate)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="applicant-muted">{t('applicant.noTasks')}</p>
            )}
            {tasks && tasks.open > tasks.items.length && (
              <p className="applicant-muted">
                {t('applicant.taskSummary', { count: tasks.items.length })}
              </p>
            )}
          </section>
          {degree === 'master' && visit === 'new' && (
            <section
              className="applicant-toolkit"
              aria-labelledby="applicant-toolkit-title"
            >
              <h2 id="applicant-toolkit-title">{t('applicant.toolkit')}</h2>
              <div>
                {[
                  ['requirements', applicantLinks.applications],
                  ['statement', applicantLinks.essays],
                ].map(([key, to]) => (
                  <article className="applicant-card" key={key}>
                    <img
                      src={`/applicant-workspace/${key}.png`}
                      alt=""
                      width={316}
                      height={112}
                    />
                    <div>
                      <h3>{t(`applicant.toolkit.${key}.title`)}</h3>
                      <p>{t(`applicant.toolkit.${key}.body`)}</p>
                      <TextLink to={to}>
                        {t(`applicant.toolkit.${key}.action`)}
                      </TextLink>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside
          className="applicant-stack"
          aria-label={t('applicant.studyContext')}
        >
          <section className="applicant-card">
            <h2>
              {t(next ? 'applicant.nextSession' : 'applicant.yourSessions')}
            </h2>
            {!sessions ? (
              sectionError()
            ) : next ? (
              <div className="applicant-session">
                <h3>{t('applicant.mentorSession')}</h3>
                <p className="applicant-muted">
                  {next.mentorName
                    ? t('applicant.withMentor', { name: next.mentorName })
                    : t('applicant.mentor')}
                </p>
                <time dateTime={next.date}>{date(next.date, true)}</time>
                <small className="applicant-muted">
                  {t('applicant.sessionDuration', {
                    minutes: next.durationMinutes,
                  })}{' '}
                  · {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </small>
                {safeMeetingLink(next.meetingLink) && (
                  <a
                    className="applicant-button applicant-button--secondary"
                    href={safeMeetingLink(next.meetingLink)!}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('applicant.joinSession')}
                    <span className="applicant-sr-only">
                      {' '}
                      {t('applicant.opensInNewTab')}
                    </span>
                    <ArrowRight size={16} aria-hidden />
                  </a>
                )}
                <TextLink to="/mentors">{t('applicant.findMentor')}</TextLink>
              </div>
            ) : (
              <p className="applicant-muted">{t('applicant.noSessions')}</p>
            )}
            {unratedSession && (
              <p className="applicant-muted">
                How was your session with {mentorName(unratedSession)}?{' '}
                <Link className="applicant-text-link" to={applicantLinks.sessions}>
                  Rate it
                </Link>
              </p>
            )}
            <div className="applicant-link-stack">
              {sessions && !next && (
                <TextLink to="/mentors">{t('applicant.findMentor')}</TextLink>
              )}
              <TextLink to={applicantLinks.sessions}>View all sessions</TextLink>
            </div>
          </section>

          <section className="applicant-card">
            <div className="applicant-section-heading">
              <h2>{t('applicant.studyProfile')}</h2>
              <Link className="applicant-text-link" to={applicantLinks.profile}>
                {t('applicant.edit')}
              </Link>
            </div>
            <dl className="applicant-study-fields">
              <div>
                <dt>{t('applicant.degree')}</dt>
                <dd>
                  {degree
                    ? t(`applicant.${degree}Degree`)
                    : t('applicant.notSet')}
                </dd>
              </div>
              {studyFields.map(([key, value]) => (
                <div key={key}>
                  <dt>{t(`applicant.${key}`)}</dt>
                  <dd>{value || t('applicant.notSet')}</dd>
                </div>
              ))}
              <div>
                <dt>{t('applicant.intendedField')}</dt>
                <dd>
                  {profile?.fieldUndecided
                    ? t('applicant.undecided')
                    : profile?.intendedField || t('applicant.notSet')}
                </dd>
              </div>
              <div>
                <dt>{t('applicant.destination')}</dt>
                <dd>
                  {profile?.destinationUndecided
                    ? t('applicant.undecided')
                    : profile?.destinations?.join(', ') ||
                      t('applicant.notSet')}
                </dd>
              </div>
              <div>
                <dt>{t('applicant.intake')}</dt>
                <dd>{intake}</dd>
              </div>
            </dl>
            {completion !== null && (
              <p className="applicant-profile-progress">
                {t('applicant.profileCompletion', { percent: completion })}
              </p>
            )}
          </section>

          <section className="applicant-card applicant-card--muted">
            <h2>{t('applicant.documents')}</h2>
            {data.documents.state === 'error' ? (
              sectionError()
            ) : (
              <>
                <p>
                  {t(
                    degree === 'master'
                      ? 'applicant.masterDocumentsBody'
                      : 'applicant.documentsCardBody',
                  )}
                </p>
                <p className="applicant-muted">
                  {t('applicant.savedDocuments', {
                    count: data.documents.data.total,
                  })}
                </p>
              </>
            )}
            <TextLink to={applicantLinks.documents}>
              {t('applicant.openDocuments')}
            </TextLink>
          </section>
          {nextDeadline && (
            <section className="applicant-card">
              <p className="applicant-eyebrow">{t('applicant.nextDeadline')}</p>
              <h3>
                {getTranslation(nextDeadline.universityName) || t('applicant.application')}
              </h3>
              <p>{date(nextDeadline.deadline)}</p>
              <TextLink to={applicationWorkspaceLink(nextDeadline.id)}>
                {t('applicant.openApplication')}
              </TextLink>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

// Exported type keeps synthetic visual fixtures aligned with the production contract.
export type { ApplicantOverview };
