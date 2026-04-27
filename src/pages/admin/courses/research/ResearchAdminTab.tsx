/**
 * ResearchAdminTab
 *
 * Authoring UI for the 8-week Research Prep curriculum. Lives as the third
 * tab inside the Course Content Management page (alongside Admissions and
 * SAT). Unlike Admissions/SAT which are mentor-owned modules, Research has
 * a fixed 8-week shape — so the UI is week-anchored rather than module CRUD.
 *
 * Each week card lets the editor:
 *   - Edit week title + tagline
 *   - Manage video lessons (with VdoCipher id + attached materials)
 *   - Manage quiz questions (with hint + explanation)
 *   - Edit the week's assignment (single per week)
 */

import React, { useMemo, useState } from 'react';
import { Button, Popconfirm, Spin, Tag, message } from 'antd';
import {
  ChevronDown,
  ChevronUp,
  FileCheck2,
  FileText,
  Link as LinkIcon,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Video,
} from 'lucide-react';
import {
  useDeleteAttachmentMutation,
  useDeleteQuizQuestionMutation,
  useDeleteVideoLessonMutation,
  useGetResearchStructureQuery,
  useUpdateWeekMutation,
  useUpsertAssignmentMutation,
  useUpsertQuizQuestionMutation,
  useUpsertVideoLessonMutation,
  researchPrepErrorMessage,
  type ResearchAssignment,
  type ResearchQuizQuestion,
  type ResearchVideoLesson,
  type ResearchWeek,
} from 'src/app/services/research-prep';
import {
  AssignmentEditorDrawer,
  LessonEditorModal,
  QuestionEditorModal,
  WeekDetailsEditorModal,
} from './ResearchEditorModals';
import './research-admin.scss';

const fmtDuration = (s: number) => {
  const m = Math.round(s / 60);
  return `${m} min`;
};

const ResearchAdminTab: React.FC = () => {
  const { data: weeks, isLoading } = useGetResearchStructureQuery();
  const [openWeekId, setOpenWeekId] = useState<string | null>(null);

  const [upsertLesson] = useUpsertVideoLessonMutation();
  const [deleteLesson] = useDeleteVideoLessonMutation();
  const [upsertQuestion] = useUpsertQuizQuestionMutation();
  const [deleteQuestion] = useDeleteQuizQuestionMutation();
  const [upsertAssignment] = useUpsertAssignmentMutation();
  const [updateWeek] = useUpdateWeekMutation();

  // Editor open-state
  const [weekDetailsEditor, setWeekDetailsEditor] = useState<ResearchWeek | null>(null);
  const [lessonEditor, setLessonEditor] = useState<{
    weekId: string;
    weekNumber: number;
    initial: ResearchVideoLesson | null;
  } | null>(null);
  const [questionEditor, setQuestionEditor] = useState<{
    weekId: string;
    weekNumber: number;
    initial: ResearchQuizQuestion | null;
  } | null>(null);
  const [assignmentEditor, setAssignmentEditor] = useState<{
    weekId: string;
    weekNumber: number;
    initial: ResearchAssignment | null;
  } | null>(null);

  const stats = useMemo(() => {
    if (!weeks) return null;
    return {
      weeks: weeks.length,
      videos: weeks.reduce((acc, w) => acc + w.videoLessons.length, 0),
      questions: weeks.reduce((acc, w) => acc + w.quiz.questions.length, 0),
      attachments: weeks.reduce(
        (acc, w) => acc + w.videoLessons.reduce((a, v) => a + v.attachments.length, 0),
        0,
      ),
    };
  }, [weeks]);

  if (isLoading || !weeks) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  const handleSaveLesson = async (weekId: string, lesson: ResearchVideoLesson) => {
    try {
      await upsertLesson({ weekId, lesson }).unwrap();
      message.success('Lesson saved.');
    } catch (e: any) {
      message.error(researchPrepErrorMessage(e, 'Could not save lesson.'));
    }
  };

  const handleDeleteLesson = async (weekId: string, lessonId: string) => {
    try {
      await deleteLesson({ weekId, lessonId }).unwrap();
      message.success('Lesson removed.');
    } catch (e: any) {
      message.error(researchPrepErrorMessage(e, 'Could not remove lesson.'));
    }
  };

  const handleSaveQuestion = async (weekId: string, q: ResearchQuizQuestion) => {
    try {
      await upsertQuestion({ weekId, question: q }).unwrap();
      message.success('Question saved.');
    } catch (e: any) {
      message.error(researchPrepErrorMessage(e, 'Could not save question.'));
    }
  };

  const handleDeleteQuestion = async (weekId: string, questionId: string) => {
    try {
      await deleteQuestion({ weekId, questionId }).unwrap();
      message.success('Question removed.');
    } catch (e: any) {
      message.error(researchPrepErrorMessage(e, 'Could not remove question.'));
    }
  };

  const handleSaveAssignment = async (weekId: string, a: ResearchAssignment) => {
    try {
      await upsertAssignment({ weekId, assignment: a }).unwrap();
      message.success('Assignment saved.');
    } catch (e: any) {
      message.error(researchPrepErrorMessage(e, 'Could not save assignment.'));
    }
  };

  const handleSaveWeekDetails = async (
    weekId: string,
    patch: { title: string; tagline: string; quizTitle?: string },
  ) => {
    try {
      await updateWeek({ weekId, patch }).unwrap();
      message.success('Week details saved.');
    } catch (e: any) {
      message.error(researchPrepErrorMessage(e, 'Could not save week details.'));
    }
  };

  return (
    <div className="research-admin">
      {stats && (
        <div className="ra-stats">
          <div className="stat">
            <div className="label">Weeks</div>
            <div className="value">{stats.weeks} / 8</div>
          </div>
          <div className="stat">
            <div className="label">Video lessons</div>
            <div className="value">{stats.videos}</div>
          </div>
          <div className="stat">
            <div className="label">Quiz questions</div>
            <div className="value">{stats.questions}</div>
          </div>
          <div className="stat">
            <div className="label">Materials</div>
            <div className="value">{stats.attachments}</div>
          </div>
        </div>
      )}

      <div className="ra-toolbar">
        <div className="lhs">
          <Sparkles size={14} color="#8b0000" />
          <span>
            Research Prep is a fixed <strong>8-week</strong> course. Author each week's videos +
            materials, the quiz (with hints &amp; explanations), and the assignment.
          </span>
        </div>
      </div>

      {weeks.map((week) => {
        const isOpen = openWeekId === week.id;
        return (
          <div key={week.id} className={`ra-week ${isOpen ? 'ra-week--open' : ''}`}>
            <div
              className="ra-week-head"
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onClick={() => setOpenWeekId(isOpen ? null : week.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpenWeekId(isOpen ? null : week.id);
                }
              }}
            >
              <div className="ra-week-num">
                <span className="l">Week</span>
                <span className="n">{week.weekNumber}</span>
              </div>
              <div className="ra-week-meta">
                <h3 className="t">{week.title}</h3>
                <p className="s">{week.tagline}</p>
              </div>
              <div className="ra-week-counts">
                <span className="pill">
                  <Video size={11} /> {week.videoLessons.length} video
                  {week.videoLessons.length === 1 ? '' : 's'}
                </span>
                <span className="pill">
                  <Sparkles size={11} /> {week.quiz.questions.length} question
                  {week.quiz.questions.length === 1 ? '' : 's'}
                </span>
                <span className="pill">
                  <FileCheck2 size={11} /> {week.assignment ? 'assignment' : 'no assignment'}
                </span>
                <Button
                  size="small"
                  icon={<Pencil size={13} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setWeekDetailsEditor(week);
                  }}
                >
                  Edit details
                </Button>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>

            {isOpen && <WeekBody
              week={week}
              onAddLesson={() =>
                setLessonEditor({ weekId: week.id, weekNumber: week.weekNumber, initial: null })
              }
              onEditLesson={(l) =>
                setLessonEditor({ weekId: week.id, weekNumber: week.weekNumber, initial: l })
              }
              onDeleteLesson={(id) => handleDeleteLesson(week.id, id)}
              onAddQuestion={() =>
                setQuestionEditor({ weekId: week.id, weekNumber: week.weekNumber, initial: null })
              }
              onEditQuestion={(q) =>
                setQuestionEditor({ weekId: week.id, weekNumber: week.weekNumber, initial: q })
              }
              onDeleteQuestion={(id) => handleDeleteQuestion(week.id, id)}
              onEditAssignment={() =>
                setAssignmentEditor({
                  weekId: week.id,
                  weekNumber: week.weekNumber,
                  initial: week.assignment,
                })
              }
            />}
          </div>
        );
      })}

      {/* Editors */}
      <WeekDetailsEditorModal
        open={!!weekDetailsEditor}
        week={weekDetailsEditor}
        onClose={() => setWeekDetailsEditor(null)}
        onSave={async (patch) => {
          if (!weekDetailsEditor) return;
          await handleSaveWeekDetails(weekDetailsEditor.id, patch);
        }}
      />
      <LessonEditorModal
        open={!!lessonEditor}
        weekNumber={lessonEditor?.weekNumber ?? 1}
        initial={lessonEditor?.initial ?? null}
        onClose={() => setLessonEditor(null)}
        onSave={async (lesson) => {
          if (!lessonEditor) return;
          await handleSaveLesson(lessonEditor.weekId, lesson);
        }}
      />
      <QuestionEditorModal
        open={!!questionEditor}
        weekNumber={questionEditor?.weekNumber ?? 1}
        initial={questionEditor?.initial ?? null}
        onClose={() => setQuestionEditor(null)}
        onSave={async (q) => {
          if (!questionEditor) return;
          await handleSaveQuestion(questionEditor.weekId, q);
        }}
      />
      <AssignmentEditorDrawer
        open={!!assignmentEditor}
        weekNumber={assignmentEditor?.weekNumber ?? 1}
        initial={assignmentEditor?.initial ?? null}
        onClose={() => setAssignmentEditor(null)}
        onSave={async (a) => {
          if (!assignmentEditor) return;
          await handleSaveAssignment(assignmentEditor.weekId, a);
        }}
      />
    </div>
  );
};

interface WeekBodyProps {
  week: ResearchWeek;
  onAddLesson: () => void;
  onEditLesson: (l: ResearchVideoLesson) => void;
  onDeleteLesson: (id: string) => void;
  onAddQuestion: () => void;
  onEditQuestion: (q: ResearchQuizQuestion) => void;
  onDeleteQuestion: (id: string) => void;
  onEditAssignment: () => void;
}

const WeekBody: React.FC<WeekBodyProps> = ({
  week,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onEditAssignment,
}) => (
  <div className="ra-week-body">
    {/* Video lessons */}
    <div className="ra-section">
      <div className="head">
        <span className="l">
          <Video size={14} /> Video lessons & materials
        </span>
        <Button
          size="small"
          icon={<Plus size={13} />}
          onClick={onAddLesson}
          type="primary"
          style={{ background: '#8b0000', borderColor: '#8b0000' }}
        >
          Add lesson
        </Button>
      </div>
      <div className="body">
        {week.videoLessons.length === 0 && <div className="ra-empty">No lessons yet.</div>}
        {week.videoLessons.map((lesson) => (
          <div key={lesson.id} className="ra-row" style={{ display: 'block' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 12, alignItems: 'center' }}>
              <div className="icon">
                <Video size={14} />
              </div>
              <div className="meta">
                <div className="t">{lesson.title}</div>
                <div className="d">
                  {fmtDuration(lesson.durationSeconds)}{' '}
                  {lesson.vdocipherVideoId ? (
                    <Tag color="green" style={{ marginLeft: 6 }}>
                      VdoCipher
                    </Tag>
                  ) : (
                    <Tag color="orange" style={{ marginLeft: 6 }}>
                      No video bound
                    </Tag>
                  )}
                  · {lesson.attachments.length} material
                  {lesson.attachments.length === 1 ? '' : 's'}
                </div>
              </div>
              <div className="actions">
                <Button size="small" icon={<Pencil size={13} />} onClick={() => onEditLesson(lesson)}>
                  Edit
                </Button>
                <Popconfirm
                  title="Remove this lesson?"
                  okText="Remove"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => onDeleteLesson(lesson.id)}
                >
                  <Button size="small" danger icon={<Trash2 size={13} />} />
                </Popconfirm>
              </div>
            </div>
            {lesson.attachments.length > 0 && (
              <div className="ra-attach-list">
                {lesson.attachments.map((a) => (
                  <span key={a.id} className="chip">
                    {a.kind === 'link' ? <LinkIcon size={11} /> : <FileText size={11} />}
                    {a.title || a.url}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    {/* Quiz */}
    <div className="ra-section">
      <div className="head">
        <span className="l">
          <Sparkles size={14} /> Quiz — {week.quiz.title}
        </span>
        <Button
          size="small"
          icon={<Plus size={13} />}
          onClick={onAddQuestion}
          type="primary"
          style={{ background: '#8b0000', borderColor: '#8b0000' }}
        >
          Add question
        </Button>
      </div>
      <div className="body">
        {week.quiz.questions.length === 0 && (
          <div className="ra-empty">No quiz questions yet.</div>
        )}
        {week.quiz.questions.map((q, idx) => (
          <div key={q.id} className="ra-row">
            <div className="icon">
              <Sparkles size={14} />
            </div>
            <div className="meta">
              <div className="t">
                {idx + 1}. {q.prompt}
              </div>
              <div className="d">
                {q.options.length} option{q.options.length === 1 ? '' : 's'} · correct: "
                {q.options[q.correctIndex]?.slice(0, 40)}
                {q.options[q.correctIndex] && q.options[q.correctIndex].length > 40 ? '…' : ''}"
                {q.hint ? ' · has hint' : ''}
              </div>
            </div>
            <div className="actions">
              <Button size="small" icon={<Pencil size={13} />} onClick={() => onEditQuestion(q)}>
                Edit
              </Button>
              <Popconfirm
                title="Remove this question?"
                okText="Remove"
                okButtonProps={{ danger: true }}
                onConfirm={() => onDeleteQuestion(q.id)}
              >
                <Button size="small" danger icon={<Trash2 size={13} />} />
              </Popconfirm>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Assignment */}
    <div className="ra-section">
      <div className="head">
        <span className="l">
          <FileCheck2 size={14} /> Assignment
        </span>
        <Button size="small" icon={<Pencil size={13} />} onClick={onEditAssignment}>
          {week.assignment ? 'Edit assignment' : 'Add assignment'}
        </Button>
      </div>
      <div className="body">
        {week.assignment ? (
          <div className="ra-row" style={{ display: 'block' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '32px 1fr',
                gap: 12,
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <div className="icon">
                <FileCheck2 size={14} />
              </div>
              <div className="meta">
                <div className="t">{week.assignment.title}</div>
                <div className="d">
                  Accepts: {week.assignment.acceptedFileTypes.map((t) => t.toUpperCase()).join(', ')} ·
                  max {week.assignment.maxFileSizeMb} MB
                  {week.assignment.allowText ? ' · text body allowed' : ''}
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12.5,
                color: '#6b7280',
                padding: '8px 10px',
                background: '#f9fafb',
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
              }}
            >
              {week.assignment.instructionsMd.slice(0, 320)}
              {week.assignment.instructionsMd.length > 320 ? '…' : ''}
            </div>
          </div>
        ) : (
          <div className="ra-empty">No assignment yet.</div>
        )}
      </div>
    </div>
  </div>
);

export default ResearchAdminTab;
