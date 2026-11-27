/**
 * Step 2 of a week: the knowledge check. Hints on demand, explanations after
 * submitting, unlimited retakes. Pass = 100%.
 */

import React, { useMemo, useState } from 'react';
import { message } from 'antd';
import { Lightbulb, ListChecks, Lock, RotateCcw } from 'lucide-react';
import {
  useSubmitQuizAttemptMutation,
  researchPrepErrorMessage,
  type QuizAttemptResult,
  type ResearchQuiz,
  type WeekLockState,
} from 'src/app/services/research-prep';
import RpPanel from './RpPanel';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

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
  // A passed quiz stays folded to its score unless the student wants to practise.
  const [practising, setPractising] = useState(false);

  const answeredCount = useMemo(
    () => quiz.questions.filter((q) => typeof answers[q.id] === 'number').length,
    [answers, quiz.questions],
  );
  const allAnswered = answeredCount === quiz.questions.length;
  const passed = lock.passed || !!result?.passed;
  const count = quiz.questions.length;

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

  const panelProps = {
    step: 2,
    title: 'Knowledge check',
    subtitle: `${count} question${count === 1 ? '' : 's'} · 100% to pass`,
    done: passed,
  };

  if (lock.locked) {
    return (
      <RpPanel {...panelProps}>
        <p className="rp-notice">
          <Lock size={14} aria-hidden />
          <span>
            Watch every lesson to unlock the knowledge check.
            {lock.bestScorePercent > 0 && ` Best score so far: ${lock.bestScorePercent}%.`}
          </span>
        </p>
      </RpPanel>
    );
  }

  // After submitting
  if (result) {
    return (
      <RpPanel {...panelProps}>
        <div className="rp-quiz">
          <div className={`rp-score${result.passed ? ' is-passed' : ''}`}>
            <span className="rp-score__value">{result.scorePercent}%</span>
            <span className="rp-score__text">
              <strong>{result.passed ? 'Passed — assignment unlocked' : 'Not yet — 100% needed'}</strong>
              <small>
                Attempt {result.attemptNumber} · best {Math.max(lock.bestScorePercent, result.scorePercent)}%
              </small>
            </span>
            {!result.passed && (
              <button type="button" className="rp-btn rp-btn--secondary rp-btn--sm" onClick={reset}>
                <RotateCcw size={14} aria-hidden /> Retake
              </button>
            )}
          </div>

          {quiz.questions.map((q, idx) => {
            const per = result.perQuestion.find((p) => p.questionId === q.id);
            const selected = per?.selectedIndex ?? -1;
            const isCorrect = per?.isCorrect ?? false;
            return (
              <div key={q.id} className={`rp-q ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
                <p className="rp-q__prompt">
                  <span className="rp-q__num">{idx + 1}</span>
                  {q.prompt}
                </p>
                <div className="rp-q__options">
                  {q.options.map((opt, optIdx) => {
                    // On a wrong answer only the student's pick is marked, so
                    // the right answer stays hidden for the retake.
                    let cls = 'rp-opt is-static';
                    if (isCorrect && optIdx === q.correctIndex) cls += ' is-right';
                    else if (!isCorrect && optIdx === selected) cls += ' is-wrong';
                    return (
                      <div key={optIdx} className={cls}>
                        <span className="rp-opt__letter" aria-hidden>
                          {OPTION_LETTERS[optIdx] ?? optIdx + 1}
                        </span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>
                {isCorrect ? (
                  <p className="rp-q__explain">
                    <strong>Why: </strong>
                    {q.explanation}
                  </p>
                ) : (
                  <p className="rp-q__explain is-retry">
                    <strong>Not quite. </strong>
                    Reread the question, use the hint, and retake.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </RpPanel>
    );
  }

  if (lock.passed && !practising) {
    return (
      <RpPanel {...panelProps}>
        <div className="rp-score is-passed">
          <span className="rp-score__value">{lock.bestScorePercent}%</span>
          <span className="rp-score__text">
            <strong>Passed — assignment unlocked</strong>
            <small>
              {lock.attempts} attempt{lock.attempts === 1 ? '' : 's'}
            </small>
          </span>
          <button
            type="button"
            className="rp-btn rp-btn--secondary rp-btn--sm"
            onClick={() => setPractising(true)}
          >
            <RotateCcw size={14} aria-hidden /> Practice again
          </button>
        </div>
      </RpPanel>
    );
  }

  // Fresh attempt
  return (
    <RpPanel {...panelProps}>
      <div className="rp-quiz">
        {lock.attempts > 0 && (
          <div className={`rp-score${lock.passed ? ' is-passed' : ''}`}>
            <span className="rp-score__value">{lock.bestScorePercent}%</span>
            <span className="rp-score__text">
              <strong>{lock.passed ? 'Passed' : 'Best so far'}</strong>
              <small>
                {lock.attempts} attempt{lock.attempts === 1 ? '' : 's'}
                {lock.passed ? '' : ' · 100% needed'}
              </small>
            </span>
          </div>
        )}

        {quiz.questions.map((q, idx) => {
          const selected = answers[q.id];
          return (
            <div key={q.id} className="rp-q" role="group" aria-labelledby={`rp-q-${q.id}`}>
              <p className="rp-q__prompt" id={`rp-q-${q.id}`}>
                <span className="rp-q__num">{idx + 1}</span>
                {q.prompt}
              </p>
              <div className="rp-q__options" role="radiogroup" aria-labelledby={`rp-q-${q.id}`}>
                {q.options.map((opt, optIdx) => {
                  const isSelected = optIdx === selected;
                  const choose = () => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                  return (
                    <div
                      key={optIdx}
                      role="radio"
                      tabIndex={0}
                      aria-checked={isSelected}
                      className={`rp-opt${isSelected ? ' is-selected' : ''}`}
                      onClick={choose}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          choose();
                        }
                      }}
                    >
                      <span className="rp-opt__letter" aria-hidden>
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
                  className="rp-q__hint-toggle"
                  onClick={() => setHintsShown((prev) => ({ ...prev, [q.id]: true }))}
                >
                  <Lightbulb size={14} aria-hidden /> Show hint
                </button>
              )}
              {q.hint && hintsShown[q.id] && (
                <p className="rp-q__hint">
                  <Lightbulb size={14} aria-hidden />
                  <span>{q.hint}</span>
                </p>
              )}
            </div>
          );
        })}

        <div className="rp-quiz__submit">
          <span className="rp-quiz__answered">
            {answeredCount} of {count} answered
          </span>
          <button
            type="button"
            className="rp-btn rp-btn--primary"
            disabled={!allAnswered || isLoading}
            onClick={handleSubmit}
          >
            <ListChecks size={16} aria-hidden />
            {isLoading ? 'Submitting…' : lock.attempts > 0 ? 'Submit again' : 'Submit answers'}
          </button>
        </div>
      </div>
    </RpPanel>
  );
};

export default KnowledgeCheckColumn;
