/**
 * "My Library" — review-focused content the student saved during tests:
 *   • Vocabulary (words tagged from R&W passages)
 *   • Marked questions (Mark-for-Review, persisted per CB questionId)
 *
 * Both are backend-backed (sat_vocabulary, sat_marked_questions tables).
 * Future tabs can slot in next to these without restructuring the page.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
  ArrowRight,
  BookmarkCheck,
  BookOpen,
  Calculator,
  Flag,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import SatHtml from 'src/components/sat-prep/SatHtml';
import { ConfirmDialog, RunnerModal } from 'src/components/sat-prep/RunnerModal';
import {
  useClearVocabularyMutation,
  useGetMarkedQuestionsQuery,
  useGetVocabularyQuery,
  useRemoveVocabularyMutation,
  useUnmarkQuestionMutation,
  type MarkedQuestion,
} from 'src/app/services/sat-prep/library';
import 'src/components/sat-prep/sat-prep-shell.scss';
import './sat-library.scss';

type Tab = 'vocabulary' | 'marked';

const SatLibraryPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('vocabulary');
  const { data: vocab = [] } = useGetVocabularyQuery();
  const { data: marked = [] } = useGetMarkedQuestionsQuery();

  return (
    <div className="sat-library">
      <header className="sat-library__header">
        <div>
          <div className="sat-eyebrow">Study tools</div>
          <h1 className="sat-page-title">My Library</h1>
          <p className="sat-page-desc">
            Vocabulary you've tagged and questions you've flagged for review — saved across
            sessions, devices, and retakes.
          </p>
        </div>
      </header>

      <div className="sat-library__tabs">
        <button
          className={`sat-library__tab ${tab === 'vocabulary' ? 'sat-library__tab--active' : ''}`}
          onClick={() => setTab('vocabulary')}
        >
          <BookmarkCheck size={14} />
          <span>Vocabulary</span>
          <span className="sat-library__tab-count">{vocab.length}</span>
        </button>
        <button
          className={`sat-library__tab ${tab === 'marked' ? 'sat-library__tab--active' : ''}`}
          onClick={() => setTab('marked')}
        >
          <Flag size={14} />
          <span>Marked questions</span>
          <span className="sat-library__tab-count">{marked.length}</span>
        </button>
      </div>

      {tab === 'vocabulary' ? <VocabularyTab /> : <MarkedTab />}
    </div>
  );
};

// ─── Vocabulary ───────────────────────────────────────────────────────
const VocabularyTab: React.FC = () => {
  const { data: words = [] } = useGetVocabularyQuery();
  const [removeWord] = useRemoveVocabularyMutation();
  const [clearAll] = useClearVocabularyMutation();
  const [search, setSearch] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return words;
    return words.filter((w) => w.word.toLowerCase().includes(q));
  }, [words, search]);

  const onRemove = async (id: string, word: string) => {
    try {
      await removeWord(id).unwrap();
      message.success(`Removed "${word}"`);
    } catch {
      message.error('Could not remove word.');
    }
  };

  const onClear = async () => {
    setConfirmClear(false);
    try {
      const r = await clearAll().unwrap();
      message.success(`Removed ${r.removed} word${r.removed === 1 ? '' : 's'}`);
    } catch {
      message.error('Could not clear vocabulary.');
    }
  };

  if (!words.length) {
    return (
      <div className="sat-card sat-library__empty">
        <div className="sat-library__empty-glyph"><BookmarkCheck size={20} /></div>
        <div className="sat-library__empty-title">No vocabulary saved yet</div>
        <div className="sat-library__empty-desc">
          During a Reading &amp; Writing test, click <strong>Add vocabulary</strong> at the bottom of the
          runner to save unfamiliar words. They'll show up here so you can review them later.
        </div>
      </div>
    );
  }

  return (
    <div className="sat-card sat-library__panel">
      <div className="sat-library__panel-toolbar">
        <div className="sat-library__search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search words…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="sat-library__search-clear" onClick={() => setSearch('')} aria-label="Clear">
              <X size={13} />
            </button>
          )}
        </div>
        <span className="sat-library__panel-count">
          {filtered.length} of {words.length}
        </span>
        <button
          className="sat-btn sat-btn--ghost sat-library__clear-btn"
          onClick={() => setConfirmClear(true)}
        >
          <Trash2 size={13} /> Clear all
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="sat-library__no-results">No words match "{search}".</div>
      ) : (
        <ul className="sat-library__vocab">
          {filtered.map((w) => (
            <li key={w.id} className="sat-library__vocab-row">
              <span className="sat-library__vocab-word">{w.word}</span>
              <span className="sat-library__vocab-date">{fmtRelative(w.createdAt)}</span>
              <button
                className="sat-library__vocab-remove"
                onClick={() => onRemove(w.id, w.word)}
                aria-label={`Remove ${w.word}`}
                title="Remove"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmClear}
        onCancel={() => setConfirmClear(false)}
        onConfirm={onClear}
        title="Clear all vocabulary?"
        description={`This will remove all ${words.length} word${words.length === 1 ? '' : 's'} from your library. This cannot be undone.`}
        confirmLabel="Clear all"
        cancelLabel="Keep them"
        destructive
      />
    </div>
  );
};

// ─── Marked questions ────────────────────────────────────────────────
const MarkedTab: React.FC = () => {
  const navigate = useNavigate();
  const { data: marks = [] } = useGetMarkedQuestionsQuery();
  const [unmark] = useUnmarkQuestionMutation();
  const [open, setOpen] = useState<MarkedQuestion | null>(null);

  const onUnmark = async (questionId: string) => {
    try {
      await unmark(questionId).unwrap();
      message.success('Unmarked.');
    } catch {
      message.error('Could not unmark.');
    }
  };

  if (!marks.length) {
    return (
      <div className="sat-card sat-library__empty">
        <div className="sat-library__empty-glyph"><Flag size={20} /></div>
        <div className="sat-library__empty-title">No marked questions yet</div>
        <div className="sat-library__empty-desc">
          Tap the <strong>Mark for Review</strong> bookmark on any question while taking a test, and
          it will appear here so you can revisit it later.
        </div>
        <button className="sat-btn sat-btn--ghost" onClick={() => navigate('/student-hub/sat-prep/practice')}>
          Browse practice <ArrowRight size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="sat-card sat-library__panel">
      <div className="sat-library__panel-toolbar">
        <span className="sat-library__panel-count">
          {marks.length} marked question{marks.length === 1 ? '' : 's'}
        </span>
      </div>

      <ul className="sat-library__marked">
        {marks.map((m) => {
          const q = m.question;
          const isMath = q?.section === 'math';
          return (
            <li key={m.id} className="sat-library__marked-row">
              <div className={`sat-library__marked-icon sat-library__marked-icon--${isMath ? 'math' : 'rw'}`}>
                {isMath ? <Calculator size={15} /> : <BookOpen size={15} />}
              </div>
              <div className="sat-library__marked-body">
                <div className="sat-library__marked-eyebrow">
                  {q ? `${q.domain} · ${capitalize(q.difficulty)}` : 'Question removed'}
                </div>
                <div className="sat-library__marked-stem">
                  {q ? <SatHtml html={truncateHtml(q.stemHtml, 220)} /> : <span>Question is no longer in the bank.</span>}
                </div>
                <div className="sat-library__marked-meta">
                  Marked {fmtRelative(m.createdAt)}
                  {q?.skill && <> · {q.skill}</>}
                </div>
              </div>
              <div className="sat-library__marked-actions">
                {q && (
                  <button
                    className="sat-btn sat-btn--ghost"
                    onClick={() => setOpen(m)}
                  >
                    Review
                  </button>
                )}
                <button
                  className="sat-library__marked-unmark"
                  onClick={() => onUnmark(m.questionId)}
                  title="Unmark"
                  aria-label="Unmark"
                >
                  <X size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Review modal — full question + rationale */}
      <RunnerModal
        open={!!open}
        onClose={() => setOpen(null)}
        eyebrow={open?.question
          ? `${open.question.section === 'math' ? 'Math' : 'Reading & Writing'} · ${capitalize(open.question.difficulty)}`
          : 'Marked question'}
        title={open?.question?.skill ?? 'Question review'}
        size="lg"
        footer={
          <>
            {open && (
              <button
                className="rm-btn rm-btn--ghost"
                onClick={() => { onUnmark(open.questionId); setOpen(null); }}
              >
                <X size={13} /> Unmark
              </button>
            )}
            <button className="rm-btn rm-btn--primary" onClick={() => setOpen(null)}>Done</button>
          </>
        }
      >
        {open?.question ? (
          <div className="sat-library__review">
            {open.question.passageHtml && (
              <SatHtml html={open.question.passageHtml} className="sat-library__review-passage" />
            )}
            <SatHtml html={open.question.stemHtml} className="sat-library__review-stem" />
            {open.question.choices && (
              <ul className="sat-library__review-choices">
                {open.question.choices.map((c) => {
                  const correct = open.question?.correctAnswer === c.label;
                  return (
                    <li key={c.label} className={`sat-library__review-choice ${correct ? 'sat-library__review-choice--correct' : ''}`}>
                      <span className="sat-library__review-letter">{c.label}</span>
                      <SatHtml html={c.text} />
                    </li>
                  );
                })}
              </ul>
            )}
            {open.question.rationaleHtml && (
              <details className="sat-library__review-rationale" open>
                <summary>Show rationale</summary>
                <SatHtml html={open.question.rationaleHtml} />
              </details>
            )}
          </div>
        ) : null}
      </RunnerModal>
    </div>
  );
};

// ─── helpers ──────────────────────────────────────────────────────────
const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const fmtRelative = (iso: string): string => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const min = Math.floor((Date.now() - t) / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const truncateHtml = (html: string, max: number): string => {
  if (!html) return '';
  // Strip tags for the truncation budget so we don't snip mid-tag; the
  // returned string is still rendered as HTML by SatHtml.
  const txt = html.replace(/<[^>]+>/g, '').trim();
  if (txt.length <= max) return html;
  // Cheap approximation — find a sentence end near the budget.
  const cutAt = txt.lastIndexOf(' ', max);
  return `${txt.slice(0, cutAt > max - 60 ? cutAt : max)}…`;
};

export default SatLibraryPage;
