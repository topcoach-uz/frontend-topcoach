import { useEffect, useState } from 'react';
import { Alert, Button, Skeleton } from 'antd';
import { ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
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
import './applicantOverview.scss';
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
  const topMajors = (latest.currentData?.majors ?? [])
    .filter((major) => !!major.name?.trim())
    .slice(0, 3)
    .map((major) => {
      const raw = Number(major.fitScore);
      const fit = Number.isFinite(raw) ? Math.round(raw <= 1 ? raw * 100 : raw) : null;
      return { name: major.name.trim(), fit: fit === null ? null : Math.max(0, Math.min(100, fit)) };
    });
  const today = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const overdue = (value: string | null) =>
    !!value && new Date(value).getTime() < Date.now();
  const listApplications = apps
    ? (apps.active.items.length ? apps.active.items : apps.shortlist.items).slice(0, 4)
    : [];
  const ringLength = 2 * Math.PI * 20;
  const ringOffset = ringLength * (1 - (completion ?? 0) / 100);

  type Focus = {
    eyebrow: string;
    title?: string;
    body?: string;
    loading?: boolean;
    retry?: boolean;
    majors?: string[];
    action?: { to: string; label: string };
    secondary?: { to: string; label: string };
  };
  let focus: Focus | null = null;
  if (!degree) {
    focus = {
      eyebrow: t('applicant.nextStep'),
      title: t(profile ? 'applicant.chooseGoal' : 'applicant.profileMissing'),
      body: t(profile ? 'applicant.chooseGoalBody' : 'applicant.profileMissingBody'),
      action: { to: applicantLinks.profile, label: t('applicant.reviewProfile') },
    };
  } else if (needsAssessment && assessment === 'loading') {
    focus = { eyebrow: t('applicant.majorMatch'), loading: true };
  } else if (needsAssessment && assessment === 'error') {
    focus = {
      eyebrow: t('applicant.majorMatch'),
      title: t('applicant.assessmentError'),
      body: t('applicant.sectionError'),
      retry: true,
    };
  } else if (needsAssessment && assessment === 'complete') {
    focus = {
      eyebrow: t('applicant.majorMatch'),
      title: t(hasViewableReport
        ? 'applicant.assessment.complete.title'
        : 'applicant.assessment.complete.noReportTitle'),
      body: t(hasViewableReport
        ? 'applicant.assessment.complete.body'
        : 'applicant.assessment.complete.noReportBody'),
      majors: matchedMajors,
      action: { to: applicantLinks.universities, label: t('applicant.assessment.complete.nextAction') },
      secondary: {
        to: hasViewableReport ? `${applicantLinks.majorMatch}?step=results` : applicantLinks.personal,
        label: hasViewableReport ? t('applicant.assessment.complete.reportAction') : t('applicant.reviewGoals'),
      },
    };
  } else if (needsAssessment) {
    focus = {
      eyebrow: t('applicant.majorMatch'),
      title: t(`applicant.assessment.${assessment}.title`),
      body: t(`applicant.assessment.${assessment}.body`),
      action: { to: applicantLinks.majorMatch, label: t(`applicant.assessment.${assessment}.action`) },
    };
  } else if (degree === 'master' && !!apps && apps.active.total === 0 && apps.shortlist.total === 0) {
    focus = {
      eyebrow: t('applicant.nextStep'),
      title: t('applicant.masterStartTitle'),
      body: t('applicant.masterStartBody'),
      action: { to: applicantLinks.newApplication, label: t('applicant.startShortlist') },
    };
  }

  const stats = [
    { key: 'applications', label: t('applicant.active'), value: apps?.active.total, to: applicantLinks.applications },
    { key: 'shortlist', label: t('applicant.shortlist'), value: apps?.shortlist.total, to: applicantLinks.applications },
    { key: 'tasks', label: t('applicant.nav.openTasks', 'Open tasks'), value: tasks?.open, to: applicantLinks.tasks },
    {
      key: 'documents',
      label: t('applicant.documents'),
      value: data.documents.state === 'ready' ? data.documents.data.total : undefined,
      to: applicantLinks.documents,
    },
  ];

  return (
    <div className="ov" data-degree={degree ?? 'unknown'} data-visit={visit}>
      {!online && (
        <Alert type="warning" showIcon message={t('applicant.offlineTitle')} description={t('applicant.offlineBody')} />
      )}
      {isError && (
        <Alert
          type="warning"
          showIcon
          message={t('applicant.refreshError')}
          action={<Button onClick={retry} loading={isFetching}>{t('applicant.retry')}</Button>}
        />
      )}

      <header className="ov-hero">
        <div className="ov-hero__text">
          <p className="ov-eyebrow">{today}</p>
          <h1>{greeting}</h1>
          <p className="ov-hero__sub">
            {t(
              degree === 'bachelor'
                ? 'applicant.bachelorWorkspaceLabel'
                : degree
                  ? `applicant.${degree}Workspace`
                  : 'applicant.workspaceSubtitle',
            )}
          </p>
        </div>
        <div className="ov-hero__aside">
          {completion !== null && (
            <Link
              to={applicantLinks.profile}
              className="ov-ring"
              aria-label={t('applicant.profileCompletion', { percent: completion })}
            >
              <span className="ov-ring__dial" aria-hidden>
                <svg viewBox="0 0 48 48" width="40" height="40">
                  <circle cx="24" cy="24" r="20" className="ov-ring__track" />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    className="ov-ring__value"
                    strokeDasharray={ringLength}
                    strokeDashoffset={ringOffset}
                  />
                </svg>
                <strong>{completion}</strong>
              </span>
              <span className="ov-ring__label">{t('applicant.studyProfile')}</span>
            </Link>
          )}
          <Button
            type="text"
            className="ov-refresh"
            aria-label={t('applicant.refresh')}
            title={t('applicant.refresh')}
            loading={isFetching}
            onClick={retry}
            icon={<RefreshCw size={16} aria-hidden />}
          />
        </div>
      </header>

      {focus && needsAssessment && (
        <section
          className={`ov-mm${assessment === 'complete' ? ' ov-mm--report' : ''}`}
          aria-label={focus.eyebrow}
        >
          <header className="ov-mm__bar">
            <span className="ov-mm__tag">
              <Sparkles size={14} strokeWidth={2} aria-hidden />
              {focus.eyebrow}
            </span>
            {assessment === 'complete' && latest.currentData?.meta?.generatedAt && (
              <span className="ov-mm__date">
                {t('applicant.assessment.complete.updated', {
                  date: date(latest.currentData.meta.generatedAt),
                })}
              </span>
            )}
          </header>

          <div className="ov-mm__body">
            <div className="ov-mm__copy">
              {focus.loading ? (
                <div role="status">
                  <p>{t('applicant.assessmentLoading')}</p>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </div>
              ) : (
                <>
                  <h2>{focus.title}</h2>
                  <p>{focus.body}</p>
                </>
              )}
              {(focus.retry || focus.action || focus.secondary) && (
                <div className="ov-mm__actions">
                  {focus.retry && (
                    <Button onClick={retryAssessment} loading={status.isFetching || latest.isFetching}>
                      {t('applicant.retry')}
                    </Button>
                  )}
                  {focus.action && (
                    <Link className="ov-button" to={focus.action.to}>
                      {focus.action.label}
                      <ArrowRight size={16} aria-hidden />
                    </Link>
                  )}
                  {focus.secondary && (
                    <Link className="ov-mm__link" to={focus.secondary.to}>
                      {focus.secondary.label}
                      <ArrowRight size={16} aria-hidden />
                    </Link>
                  )}
                </div>
              )}
            </div>

            {assessment === 'complete' ? (
              <div className="ov-mm__matches">
                <p className="ov-mm__matches-title">{t('applicant.assessment.complete.summaryTitle')}</p>
                {latest.isFetching && latest.currentData === undefined ? (
                  <Skeleton active title={false} paragraph={{ rows: 3 }} />
                ) : topMajors.length > 0 ? (
                  <ol>
                    {topMajors.map((major, index) => (
                      <li
                        key={major.name}
                        className={`ov-mm__match${index === 0 ? ' is-top' : ''}`}
                        style={{ '--i': index } as React.CSSProperties}
                      >
                        <span className="ov-mm__rank" aria-hidden>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="ov-mm__name">
                          <strong>{major.name}</strong>
                          {index === 0 && (
                            <em>{t('applicant.assessment.complete.bestFit', 'Best fit')}</em>
                          )}
                        </span>
                        {major.fit !== null && (
                          <>
                            <span className="ov-mm__meter" aria-hidden>
                              <span style={{ '--fit': `${major.fit}%` } as React.CSSProperties} />
                            </span>
                            <span className="ov-mm__fit">
                              {major.fit}
                              <small>%</small>
                            </span>
                          </>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="ov-mm__empty">{t('applicant.assessment.complete.summaryFallback')}</p>
                )}
              </div>
            ) : assessment !== 'loading' && assessment !== 'error' ? (
              <div className="ov-mm__video">
                <iframe
                  src="https://www.youtube-nocookie.com/embed/0ntdgdT3JCs?rel=0"
                  title={t('applicant.watchIntroduction')}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : null}
          </div>
        </section>
      )}

      {focus && !needsAssessment && (
        <section className="ov-focus" aria-label={focus.eyebrow}>
          <div className="ov-focus__body">
            <p className="ov-eyebrow ov-eyebrow--light">{focus.eyebrow}</p>
            {focus.loading ? (
              <div role="status">
                <p>{t('applicant.assessmentLoading')}</p>
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            ) : (
              <>
                <h2>{focus.title}</h2>
                <p>{focus.body}</p>
              </>
            )}
            {!!focus.majors?.length && (
              <ol className="ov-chips">
                {focus.majors.map((major) => <li key={major}>{major}</li>)}
              </ol>
            )}
          </div>
          {(focus.retry || focus.action || focus.secondary) && (
            <div className="ov-focus__actions">
              {focus.retry && (
                <Button onClick={retryAssessment} loading={status.isFetching || latest.isFetching}>
                  {t('applicant.retry')}
                </Button>
              )}
              {focus.action && (
                <Link className="ov-button" to={focus.action.to}>
                  {focus.action.label}
                  <ArrowRight size={16} aria-hidden />
                </Link>
              )}
              {focus.secondary && (
                <Link className="ov-button ov-button--ghost" to={focus.secondary.to}>
                  {focus.secondary.label}
                </Link>
              )}
            </div>
          )}
        </section>
      )}

      <nav className="ov-stats" aria-label={t('applicant.studyContext')}>
        {stats.map((stat, index) => (
          <Link key={stat.key} to={stat.to} className="ov-stat" style={{ animationDelay: `${index * 60}ms` }}>
            <span className="ov-stat__label">{stat.label}</span>
            <strong className="ov-stat__value">{stat.value ?? '–'}</strong>
            <ArrowRight size={14} aria-hidden className="ov-stat__arrow" />
          </Link>
        ))}
      </nav>

      <div className="ov-grid">
        <div className="ov-col">
          <section className="ov-card" aria-labelledby="ov-apps-title">
            <div className="ov-card__head">
              <h2 id="ov-apps-title">{t('applicant.yourApplications')}</h2>
              <Link className="ov-link" to={applicantLinks.applications}>
                {t('applicant.viewAll')}
              </Link>
            </div>
            {!apps ? (
              sectionError()
            ) : listApplications.length ? (
              <ul className="ov-list">
                {listApplications.map((app: OverviewApplication) => (
                  <li key={app.id}>
                    <Link to={applicationWorkspaceLink(app.id)} className="ov-row">
                      <span className="ov-row__main">
                        <strong>{getTranslation(app.universityName) || t('applicant.universityNotSet')}</strong>
                        <small>{getTranslation(app.major) || t('applicant.fieldNotSet')}</small>
                      </span>
                      {app.deadline && (
                        <time className={overdue(app.deadline) ? 'is-overdue' : undefined} dateTime={app.deadline}>
                          {date(app.deadline)}
                        </time>
                      )}
                      <span className="ov-pill">
                        {t(`applicant.status.${app.status}`, t('applicant.statusUnknown'))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="ov-empty">
                <p>{t('applicant.empty.active.body')}</p>
                <Link className="ov-link" to={applicantLinks.newApplication}>
                  {t('applicant.addApplication')} <ArrowRight size={14} aria-hidden />
                </Link>
              </div>
            )}
          </section>

          <section className="ov-card" aria-labelledby="ov-tasks-title">
            <div className="ov-card__head">
              <h2 id="ov-tasks-title">{t('applicant.upcomingTasks')}</h2>
              <Link className="ov-link" to={applicantLinks.tasks}>
                {t('applicant.viewAll')}
              </Link>
            </div>
            {!tasks ? (
              sectionError()
            ) : tasks.items.length ? (
              <ul className="ov-list">
                {tasks.items.slice(0, 5).map((task) => (
                  <li key={task.id}>
                    <Link
                      to={task.applicationId ? applicationWorkspaceLink(task.applicationId) : applicantLinks.tasks}
                      className="ov-row"
                    >
                      <span className={`ov-dot${overdue(task.dueDate) ? ' is-overdue' : ''}`} aria-hidden />
                      <span className="ov-row__main">
                        <strong>{task.title}</strong>
                        <small>
                          {overdue(task.dueDate)
                            ? t('applicant.overdue')
                            : t(`applicant.taskStatus.${task.status}`, t('applicant.task'))}
                        </small>
                      </span>
                      <time dateTime={task.dueDate ?? undefined}>{date(task.dueDate)}</time>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="ov-empty">
                <p>{t('applicant.noTasks')}</p>
              </div>
            )}
          </section>
        </div>

        <aside className="ov-col" aria-label={t('applicant.studyContext')}>
          <section className="ov-card">
            <div className="ov-card__head">
              <h2>{t(next ? 'applicant.nextSession' : 'applicant.yourSessions')}</h2>
              <Link className="ov-link" to={applicantLinks.sessions}>
                {t('applicant.viewAll')}
              </Link>
            </div>
            {!sessions ? (
              sectionError()
            ) : next ? (
              <div className="ov-session">
                <time dateTime={next.date}>{date(next.date, true)}</time>
                <p>
                  {next.mentorName ? t('applicant.withMentor', { name: next.mentorName }) : t('applicant.mentor')}
                  {' · '}
                  {t('applicant.sessionDuration', { minutes: next.durationMinutes })}
                </p>
                {safeMeetingLink(next.meetingLink) && (
                  <a className="ov-button" href={safeMeetingLink(next.meetingLink)!} target="_blank" rel="noreferrer">
                    {t('applicant.joinSession')}
                    <span className="applicant-sr-only"> {t('applicant.opensInNewTab')}</span>
                    <ArrowRight size={16} aria-hidden />
                  </a>
                )}
              </div>
            ) : (
              <div className="ov-empty">
                <p>{t('applicant.noSessions')}</p>
                <Link className="ov-link" to="/mentors">
                  {t('applicant.findMentor')} <ArrowRight size={14} aria-hidden />
                </Link>
              </div>
            )}
            {unratedSession && (
              <p className="ov-note">
                How was your session with {mentorName(unratedSession)}?{' '}
                <Link className="ov-link" to={applicantLinks.sessions}>Rate it</Link>
              </p>
            )}
          </section>

          {nextDeadline && (
            <Link to={applicationWorkspaceLink(nextDeadline.id)} className="ov-card ov-deadline">
              <p className="ov-eyebrow">{t('applicant.nextDeadline')}</p>
              <strong>{getTranslation(nextDeadline.universityName) || t('applicant.application')}</strong>
              <time dateTime={nextDeadline.deadline ?? undefined}>{date(nextDeadline.deadline)}</time>
            </Link>
          )}

          <section className="ov-card">
            <div className="ov-card__head">
              <h2>{t('applicant.studyProfile')}</h2>
              <Link className="ov-link" to={applicantLinks.profile}>
                {t('applicant.edit')}
              </Link>
            </div>
            {completion !== null && (
              <div
                className="ov-progress"
                role="progressbar"
                aria-valuenow={completion}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('applicant.profileCompletion', { percent: completion })}
              >
                <span style={{ width: `${completion}%` }} />
              </div>
            )}
            <dl className="ov-facts">
              <div>
                <dt>{t('applicant.degree')}</dt>
                <dd>{degree ? t(`applicant.${degree}Degree`) : t('applicant.notSet')}</dd>
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
                  {profile?.fieldUndecided ? t('applicant.undecided') : profile?.intendedField || t('applicant.notSet')}
                </dd>
              </div>
              <div>
                <dt>{t('applicant.destination')}</dt>
                <dd>
                  {profile?.destinationUndecided
                    ? t('applicant.undecided')
                    : profile?.destinations?.join(', ') || t('applicant.notSet')}
                </dd>
              </div>
              <div>
                <dt>{t('applicant.intake')}</dt>
                <dd>{intake}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}

// Exported type keeps synthetic visual fixtures aligned with the production contract.
export type { ApplicantOverview };
