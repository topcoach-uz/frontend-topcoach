/**
 * One SAT question rendered in Bluebook-style two-pane layout:
 *   - Left pane: passage (R&W) or test directions (math).
 *   - Right pane: question stem + choices (MCQ) or numeric input (SPR).
 *
 * The vertical separator between panes is draggable. When `passageHtml` is
 * absent, the layout still uses two panes so the test feel stays consistent
 * — the left side shows section directions in that case.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import SatHtml from './SatHtml';
import type { SatChoice, SatQuestion } from 'src/app/services/sat-prep/types';

const SPR_DIRECTIONS_HTML = `
<h3>Student-Produced Response Directions</h3>
<ul>
  <li>If you find more than one correct answer, enter only one answer.</li>
  <li>You can enter up to 5 characters for a positive answer and up to 6 characters (including the negative sign) for a negative answer.</li>
  <li>If your answer is a fraction that doesn't fit in the provided space, enter the decimal equivalent.</li>
  <li>If your answer is a decimal that doesn't fit, truncate or round at the fourth digit.</li>
  <li>If your answer is a mixed number (e.g. 3½), enter it as an improper fraction (7/2) or its decimal equivalent (3.5).</li>
  <li>Don't enter symbols such as a percent sign, comma, or dollar sign.</li>
</ul>
`;

const MCQ_DIRECTIONS_HTML = `
<h3>Math Directions</h3>
<p>The questions in this section address algebra, advanced math, problem-solving and data analysis, and geometry & trigonometry. Read each question carefully and choose the best answer.</p>
<p>You may use a calculator for any question.</p>
`;

interface Props {
  question: SatQuestion;
  index: number;
  total: number;
  selectedChoice: 'A' | 'B' | 'C' | 'D' | null;
  sprAnswer: string;
  marked: boolean;
  showAnswer?: boolean;
  onChoose: (label: 'A' | 'B' | 'C' | 'D') => void;
  onSpr: (value: string) => void;
  onToggleMark: () => void;
}

const SatQuestionCard: React.FC<Props> = ({
  question,
  index,
  total,
  selectedChoice,
  sprAnswer,
  marked,
  showAnswer,
  onChoose,
  onSpr,
  onToggleMark,
}) => {
  const isMath = question.section === 'math';
  const isSpr = question.questionType === 'student-produced-response';
  const correctLetter = typeof question.correctAnswer === 'string' ? question.correctAnswer : null;

  // Left-pane content: passage if present, else section directions.
  const leftHtml =
    question.passageHtml ??
    (isMath ? (isSpr ? SPR_DIRECTIONS_HTML : MCQ_DIRECTIONS_HTML) : '');

  // Draggable separator
  const bodyRef = useRef<HTMLDivElement>(null);
  const [leftPct, setLeftPct] = useState(50);
  const draggingRef = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current || !bodyRef.current) return;
      const rect = bodyRef.current.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      setLeftPct(Math.max(20, Math.min(80, ratio * 100)));
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div className="sat-question-card">
      <header className="sat-qc__topbar">
        <div className="sat-qc__topbar-left">
          <span>{isMath ? 'Section 2: Math' : 'Section 1: Reading and Writing'}</span>
          <a href="#" onClick={(e) => e.preventDefault()}>Directions</a>
        </div>
        <div className="sat-qc__topbar-center">
          <span aria-hidden>⏱</span>
          <span className="sat-qc__timer">--:--</span>
        </div>
        <div className="sat-qc__topbar-right">
          <span>Highlights & Notes</span>
          <span>More</span>
        </div>
      </header>
      <div className="sat-qc__divider" />

      <main ref={bodyRef} className="sat-qc__body">
        <div className="sat-qc__pane sat-qc__pane--left" style={{ flex: `0 0 ${leftPct}%` }}>
          {leftHtml ? (
            <SatHtml
              html={leftHtml}
              className={question.passageHtml ? 'sat-qc__passage' : 'sat-qc__directions'}
            />
          ) : (
            <div className="sat-qc__pane--empty">No passage</div>
          )}
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          className="sat-qc__separator"
          onMouseDown={() => {
            draggingRef.current = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
          }}
        >
          <div className="sat-qc__separator-handle" />
        </div>

        <div className="sat-qc__pane sat-qc__pane--right" style={{ flex: `0 0 ${100 - leftPct}%` }}>
          <div className="sat-qc__qhead">
            <div className="sat-qc__qnum">{index + 1}</div>
            <button type="button" className="sat-qc__mark" onClick={onToggleMark}>
              {marked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              <span>Mark for Review</span>
            </button>
            <div className="sat-qc__meta">
              <span className="sat-qc__pill">{question.questionId}</span>
              <span className={`sat-qc__pill sat-qc__pill--${question.difficulty}`}>{question.difficulty}</span>
              <span className="sat-qc__skill" title={question.skill}>{question.skill}</span>
            </div>
          </div>
          <div className="sat-qc__divider sat-qc__divider--inline" />

          <SatHtml html={question.stemHtml} className="sat-qc__stem" />

          {!isSpr && question.choices && (
            <ul className="sat-qc__choices">
              {question.choices.map((c) => (
                <ChoiceItem
                  key={c.label}
                  choice={c}
                  selected={selectedChoice === c.label}
                  correct={!!showAnswer && correctLetter === c.label}
                  incorrectShown={!!showAnswer && selectedChoice === c.label && correctLetter !== c.label}
                  onClick={() => onChoose(c.label)}
                />
              ))}
            </ul>
          )}

          {isSpr && (
            <div className="sat-qc__spr">
              <label className="sat-qc__spr-label" htmlFor={`spr-${question.id}`}>Your Answer</label>
              <input
                id={`spr-${question.id}`}
                type="text"
                value={sprAnswer}
                onChange={(e) => onSpr(e.target.value)}
                placeholder="Enter your answer"
                className="sat-qc__spr-input"
              />
              <div className="sat-qc__spr-hint">
                Number or fraction (e.g., 42, 3/4, 0.75).
              </div>
              {showAnswer && typeof question.correctAnswer === 'object' && (
                <div className="sat-qc__spr-accepted">
                  <strong>Accepted:</strong>{' '}
                  {question.correctAnswer.acceptedForms.map((f, i) => (
                    <code key={i}>{f}</code>
                  ))}
                </div>
              )}
            </div>
          )}

          {showAnswer && question.rationaleHtml && (
            <details className="sat-qc__rationale" open>
              <summary>Explanation</summary>
              <SatHtml html={question.rationaleHtml} className="sat-qc__rationale-body" />
            </details>
          )}
        </div>
      </main>
      <div className="sat-qc__divider" />
    </div>
  );
};

const ChoiceItem: React.FC<{
  choice: SatChoice;
  selected: boolean;
  correct: boolean;
  incorrectShown: boolean;
  onClick: () => void;
}> = ({ choice, selected, correct, incorrectShown, onClick }) => {
  const cls = [
    'sat-qc__choice',
    selected && 'sat-qc__choice--selected',
    correct && 'sat-qc__choice--correct',
    incorrectShown && 'sat-qc__choice--incorrect',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <li className={cls}>
      <button type="button" onClick={onClick} className="sat-qc__choice-btn">
        <span className="sat-qc__choice-letter">{choice.label}</span>
        <SatHtml html={choice.text} className="sat-qc__choice-body" />
      </button>
    </li>
  );
};

export default SatQuestionCard;
