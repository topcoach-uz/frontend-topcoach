import React, { useState } from "react";

function SampleAnswer({ task, unlocked }) {
  const [confirming, setConfirming] = useState(false);
  const [shown, setShown] = useState(false);
  const open = unlocked || shown;
  if (!open) {
    return (
      <div className="sample-writing sample-locked">
        {confirming ? (
          <>
            <p>
              Seeing a sample first makes this practice less useful. Show
              anyway?
            </p>
            <div className="sample-actions">
              <button className="solid" onClick={() => setShown(true)}>
                Show anyway
              </button>
              <button className="link-button" onClick={() => setConfirming(false)}>
                Keep practising
              </button>
            </div>
          </>
        ) : (
          <button className="link-button" onClick={() => setConfirming(true)}>
            Show sample answer
          </button>
        )}
      </div>
    );
  }
  return (
    <details open className="sample-writing">
      <summary>Sample Writing Answer</summary>
      {task.sampleTitle && <h2 className="center">{task.sampleTitle}</h2>}
      {task.sampleAnswer.split("\n\n").map((text, index) => (
        <p key={index}>{text}</p>
      ))}
    </details>
  );
}

export function ImportedWritingPrompt({ task, part, book, test, sampleUnlocked = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <>
      <h2>TASK {part}</h2>
      <p>You should spend about {part === 1 ? 20 : 40} minutes on this task.</p>
      {task.prompt ? (
        <div className="writing-prompt">
          <p>{task.prompt}</p>
          {(task.instructions || [])
            .filter((text) => !/^Give reasons for your answer/.test(text))
            .map((text, index) => (
              <p key={index}>{text}</p>
            ))}
        </div>
      ) : (
        <>
          <p className="hint" role="status">
            The chart is available, but the written task prompt has not been
            imported.
          </p>
          {part === 1 && (
            <div className="writing-prompt">
              <p>
                Summarise the information by selecting and reporting the main
                features, and make comparisons where relevant.
              </p>
            </div>
          )}
        </>
      )}
      {(task.instructions || [])
        .filter((text) => /^Give reasons for your answer/.test(text))
        .map((text, index) => (
          <p key={index}>{text}</p>
        ))}
      <p>Write at least {part === 1 ? 150 : 250} words.</p>
      {part === 1 &&
        (task.chart && !imageFailed ? (
          <img
            className="writing-chart"
            src={task.chart}
            alt={`Academic ${book} Test ${test} Writing Task ${part} chart`}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <p className="hint" role="status">
            Chart is not available.
          </p>
        ))}
      {task.sampleAnswer ? (
        <SampleAnswer key={`${book}-${test}-${part}`} task={task} unlocked={sampleUnlocked} />
      ) : (
        <p className="hint">
          A sample writing answer has not been imported for this task.
        </p>
      )}
    </>
  );
}
