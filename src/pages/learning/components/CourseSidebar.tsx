import React, { useMemo } from 'react';
import { Button } from 'antd';
import { Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './CourseSidebar.scss';

/**
 * Editorial-style course sidebar.
 *
 * Replaces the previous Ant Collapse-based accordion with a "magazine
 * table-of-contents" layout: all modules are always visible, lessons
 * are numbered, the current lesson gets a maroon dot + left rule, and
 * completed lessons are marked with a single check glyph.
 */

interface Lesson {
  id: string;
  title: string;
  lessonType?: 'video' | 'pdf' | 'live_session';
  duration?: number;
  isPremium?: boolean;
  submoduleId?: string | null;
}

interface Submodule {
  id: string;
  title: string;
  lessons?: Lesson[];
}

interface Module {
  id: string;
  title?: string;
  mentorName?: string | null;
  mentor?: { email?: string };
  estimatedDuration?: number;
  lessons?: Lesson[];
  submodules?: Submodule[];
}

interface ProgressEntry {
  lessonId: string;
  isCompleted: boolean;
  progressPercentage?: number;
}

interface UserProgress {
  completedLessons?: number;
  totalLessons?: number;
  progress?: ProgressEntry[];
}

interface CourseSidebarProps {
  courseStructure: Module[];
  userProgress: UserProgress | null | undefined;
  selectedLessonId: string | null;
  onLessonSelect: (lessonId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  courseLabel?: string;
}

const formatDuration = (minutes?: number): string => {
  if (!minutes || minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
};

const firstNameOf = (module: Module): string => {
  const raw = module.mentorName || module.mentor?.email?.split('@')[0] || '';
  return raw.split(' ')[0] || '';
};

const pad2 = (n: number): string => String(n).padStart(2, '0');

const CourseSidebar: React.FC<CourseSidebarProps> = ({
  courseStructure,
  userProgress,
  selectedLessonId,
  onLessonSelect,
  collapsed,
  onToggleCollapse,
  courseLabel,
}) => {
  const { t } = useTranslation();

  const { totalLessons, completedLessons } = useMemo(() => {
    let total = 0;
    courseStructure?.forEach((m) => {
      total += m.lessons?.filter((l) => !l.submoduleId).length ?? 0;
      total += m.submodules?.reduce(
        (acc, sm) => acc + (sm.lessons?.length ?? 0),
        0,
      ) ?? 0;
    });
    return {
      totalLessons: total,
      completedLessons: userProgress?.completedLessons ?? 0,
    };
  }, [courseStructure, userProgress?.completedLessons]);

  const isLessonCompleted = (lessonId: string): boolean =>
    !!userProgress?.progress?.some((p) => p.lessonId === lessonId && p.isCompleted);

  const overallPct =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  if (collapsed) {
    return (
      <>
        <div className="course-sidebar-collapsed desktop-only">
          <button
            type="button"
            className="course-icon"
            onClick={onToggleCollapse}
            aria-label={t('Open course sidebar') as string}
            title={t('Open course sidebar') as string}
          >
            <PanelLeftOpen size={18} aria-hidden />
          </button>
          <div className="progress-summary" title={`${completedLessons} of ${totalLessons} lessons completed`}>
            <span className="pct">{overallPct}%</span>
          </div>
        </div>
        <Button
          type="primary"
          icon={<Menu size={16} />}
          onClick={onToggleCollapse}
          className="mobile-sidebar-toggle"
          size="large"
        >
          Menu
        </Button>
      </>
    );
  }

  let runningLessonNo = 0;

  const renderLessonRow = (lesson: Lesson) => {
    runningLessonNo += 1;
    const completed = isLessonCompleted(lesson.id);
    const current = selectedLessonId === lesson.id;
    return (
      <button
        type="button"
        key={lesson.id}
        className={[
          'cs-row',
          current ? 'cs-row--current' : '',
          completed ? 'cs-row--done' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => onLessonSelect(lesson.id)}
      >
        <span className="cs-row__num">{pad2(runningLessonNo)}</span>
        <span className="cs-row__body">
          <span className="cs-row__title">
            {lesson.title}
            {lesson.isPremium && <span className="cs-row__premium" aria-label="Premium">★</span>}
          </span>
          <span className="cs-row__meta">{formatDuration(lesson.duration)}</span>
        </span>
        <span className="cs-row__mark" aria-hidden>
          {current ? '●' : completed ? '✓' : ''}
        </span>
      </button>
    );
  };

  return (
    <>
      <div className="mobile-sidebar-overlay" onClick={onToggleCollapse} />

      <div className={`course-sidebar ${collapsed ? 'hidden' : ''}`}>
        {/* Header */}
        <header className="cs-header">
          <div className="cs-header__eyebrow">
            {courseLabel ? `${t('Course')} · ${courseLabel}` : t('Course')}
          </div>
          <div className="cs-header__title-row">
            <h2 className="cs-header__title">{t('Course Content')}</h2>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="cs-header__close"
              aria-label={t('Collapse course sidebar') as string}
              title={t('Collapse course sidebar') as string}
            >
              <X size={16} className="mobile-only-icon" aria-hidden />
              <PanelLeftClose size={16} className="desktop-only-icon" aria-hidden />
            </button>
          </div>

          <div className="cs-header__progress">
            <div className="cs-header__progress-text">
              {completedLessons} / {totalLessons} {t('lessons')}
            </div>
            <div className="cs-header__progress-rule">
              <span style={{ width: `${overallPct}%` }} />
            </div>
          </div>
        </header>

        {/* Modules — all always-expanded */}
        <nav className="cs-toc" aria-label={t('Course modules') as string}>
          {courseStructure?.map((module, moduleIndex) => {
            const mentor = firstNameOf(module);
            const directLessonCount = module.lessons?.filter((l) => !l.submoduleId).length ?? 0;
            const subLessonCount =
              module.submodules?.reduce((acc, sm) => acc + (sm.lessons?.length ?? 0), 0) ?? 0;
            const totalForModule = directLessonCount + subLessonCount;
            return (
              <section className="cs-module" key={module.id ?? moduleIndex}>
                <header className="cs-module__head">
                  <div className="cs-module__eyebrow">
                    {t('Module')} {pad2(moduleIndex + 1)}
                  </div>
                  <h3 className="cs-module__title">
                    {module.title || `Module ${moduleIndex + 1}`}
                  </h3>
                  <div className="cs-module__meta">
                    {mentor && <em>{mentor}</em>}
                    {mentor && (totalForModule > 0 || module.estimatedDuration) && <span aria-hidden> · </span>}
                    {totalForModule > 0 && <span>{totalForModule} {t('lessons')}</span>}
                    {module.estimatedDuration ? (
                      <>
                        <span aria-hidden> · </span>
                        <span>{formatDuration(module.estimatedDuration)}</span>
                      </>
                    ) : null}
                  </div>
                </header>

                <div className="cs-module__rows">
                  {module.lessons
                    ?.filter((l) => !l.submoduleId)
                    .map((lesson) => renderLessonRow(lesson))}

                  {module.submodules?.map((submodule) => (
                    <div className="cs-submodule" key={submodule.id}>
                      <div className="cs-submodule__title">{submodule.title}</div>
                      <div className="cs-submodule__rows">
                        {submodule.lessons?.map((lesson) => renderLessonRow(lesson))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default CourseSidebar;
