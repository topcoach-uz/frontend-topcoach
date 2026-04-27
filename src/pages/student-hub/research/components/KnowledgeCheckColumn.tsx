/**
 * Knowledge Check (quiz) column — center of the module view.
 *
 * Renders all quiz questions with hint + explanation + retake. Pass = 100%.
 */

import React, { useMemo, useState } from 'react';
import { message } from 'antd';
import { Lightbulb, ListChecks, Lock, RefreshCw } from 'lucide-react';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
import {
  useSubmitQuizAttemptMutation,
  researchPrepErrorMessage,
  type QuizAttemptResult,
  type ResearchQuiz,
  type WeekLockState,
} from 'src/app/services/research-prep';

interface KnowledgeCheckColumnProps {
  weekId: string;
  quiz: ResearchQuiz;
  lock: WeekLockState['quiz'];
}

const KnowledgeCheckColumn: React.FC<KnowledgeCheckColumnProps> = ({ weekId, quiz, lock }) => {
  const [submit, { isLoading }] = useSubmitQuizAttemptMutation();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [hintsShown, setHintsShown] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<QuizAttemptResult | null>(null);

  const allAnswered = useMemo(
    () => quiz.questions.every((q) => typeof answers[q.id] === 'number'),
    [answers, quiz.questions],
  );

  const handleSubmit = async () => {
    if (!allAnswered) {
      message.warning('Answer every question before submitting.');
      return;
    }
    try {
      const res = await submit({
        weekId,
        answers: Object.entries(answers).map(([questionId, selectedIndex]) => ({
          questionId,
          selectedIndex,
        })),
      }).unwrap();
      setResult(res);
      if (res.passed) message.success('Quiz passed — assignment unlocked.');
      else message.info(`Scored ${res.scorePercent}%. Review and retake.`);
    } catch (err: any) {
      message.error(researchPrepErrorMessage(err, 'Could not submit quiz.'));
    }
  };

  const reset = () => {
    setAnswers({});
    setHintsShown({});
    setResult(null);
  };

  if (lock.locked) {
    return (
      <div className="rp-section">
        <div className="rp-section-head">
          <span className="icon">
            <ListChecks size={14} />
          </span>
          Knowledge Check
          <span style={{ marginLeft: 'auto', color: '#8a93a0', fontSize: 11 }}>
            {quiz.questions.length} Questions
          </span>
        </div>
        <div className="rp-section-body">
          <div
            style={{
              padding: 14,
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              background: '#f3f4f6',
              fontSize: 12.5,
              color: '#5b6470',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <Lock size={13} />
            Watch all videos in this week to unlock the quiz. Best score so far:{' '}
            <strong style={{ marginLeft: 4 }}>{lock.bestScorePercent}%</strong>
          </div>
        </div>
      </div>
    );
  }

  // Result-view (after submitting)
  if (result) {
    return (
      <div className="rp-section">
        <div className="rp-section-head">
          <span className="icon">
            <ListChecks size={14} />
          </span>
          Knowledge Check
          <span style={{ marginLeft: 'auto', color: '#8a93a0', fontSize: 11 }}>
            {quiz.questions.length} Questions
          </span>
        </div>
        <div className="rp-section-body">
          <div className={`rp-quiz`}>
            <div className={`quiz-summary ${result.passed ? 'is-passed' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="score">{result.scorePercent}%</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f1419' }}>
                    {result.passed ? 'Passed — assignment unlocked' : 'Need 100% to unlock'}
                  </div>
                  <div style={{ fontSize: 11.5 }}>
                    Attempt #{result.attemptNumber} · best{' '}
                    {Math.max(lock.bestScorePercent, result.scorePercent)}%
                  </div>
                </div>
              </div>
              <button type="button" className="q-hint-toggle" onClick={reset}>
                <RefreshCw size={12} /> Retake
              </button>
            </div>

            {quiz.questions.map((q, idx) => {
              const per = result.perQuestion.find((p) => p.questionId === q.id);
              const selected = per?.selectedIndex ?? -1;
              const isCorrect = per?.isCorrect ?? false;
              return (
                <div key={q.id} className={`rp-quiz-q ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
                  <div className="q-prompt">
                    <span className="num">{idx + 1}.</span>
                    <span>{q.prompt}</span>
                  </div>
                  <div className="q-options">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = optIdx === selected;
                      const isRight = optIdx === q.correctIndex;
                      // Only highlight the correct option when the student
                      // actually got it right. On wrong answers we mark only
                      // their pick (red) — the answer stays hidden so they
                      // re-think on retake.
                      let cls = 'q-opt disabled';
                      if (isCorrect && isRight) cls += ' right';
                      else if (!isCorrect && isSelected) cls += ' wrong';
                      return (
                        <div key={optIdx} className={cls}>
                          <span className="letter" aria-hidden>
                            {OPTION_LETTERS[optIdx] ?? optIdx + 1}
                          </span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                  {isCorrect ? (
                    <div className="q-explanation">
                      <span className="lab">Why:</span>
                      {q.explanation}
                    </div>
                  ) : (
                    <div className="q-explanation q-explanation--retry">
                      <span className="lab">Not quite —</span>
                      reread the question, use the hint, and retake.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Fresh attempt
  return (
    <div className="rp-section">
      <div className="rp-section-head">
        <span className="icon">
          <ListChecks size={14} />
        </span>
        Knowledge Check
        <span style={{ marginLeft: 'auto', color: '#8a93a0', fontSize: 11 }}>
          {quiz.questions.length} Questions
        </span>
      </div>
      <div className="rp-section-body">
        <div className="rp-quiz">
          {lock.attempts > 0 && (
            <div className="quiz-summary">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="score">{lock.bestScorePercent}%</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f1419' }}>Best so far</div>
                  <div style={{ fontSize: 11.5 }}>
                    {lock.attempts} attempt{lock.attempts === 1 ? '' : 's'} · need 100%
                  </div>
                </div>
              </div>
            </div>
          )}

          {quiz.questions.map((q, idx) => {
            const selected = answers[q.id];
            return (
              <div key={q.id} className="rp-quiz-q">
                <div className="q-prompt">
                  <span className="num">{idx + 1}.</span>
                  <span>{q.prompt}</span>
                </div>
                <div className="q-options">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = optIdx === selected;
                    return (
                      <div
                        key={optIdx}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        className={`q-opt ${isSelected ? 'selected' : ''}`}
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                          }
                        }}
                      >
                        <span className="letter" aria-hidden>
                          {OPTION_LETTERS[optIdx] ?? optIdx + 1}
                        </span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>
                {q.hint && !hintsShown[q.id] && (
                  <button
                    type="button"
                    className="q-hint-toggle"
                    onClick={() => setHintsShown((prev) => ({ ...prev, [q.id]: true }))}
                  >
                    <Lightbulb size={12} /> Show hint
                  </button>
                )}
                {q.hint && hintsShown[q.id] && (
                  <div className="q-hint">
                    <span className="lab">Hint:</span>
                    {q.hint}
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            disabled={!allAnswered || isLoading}
            onClick={handleSubmit}
            style={{
              marginTop: 14,
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              background: !allAnswered ? '#e5e7eb' : '#7c1c1c',
              color: !allAnswered ? '#8a93a0' : '#fff',
              border: 0,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: !allAnswered ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <ListChecks size={14} />
            {isLoading ? 'Submitting…' : 'Submit Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCheckColumn;
