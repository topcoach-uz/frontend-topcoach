import React, { useState } from "react";

export function ImportedWritingPrompt({ task, part, book, test }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <>
      <h2>Task {part}</h2>
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
            This task's written prompt isn't available yet.
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
        <details open className="sample-writing">
          <summary>Sample answer</summary>
          {task.sampleTitle && <h2 className="center">{task.sampleTitle}</h2>}
          {task.sampleAnswer.split("\n\n").map((text, index) => (
            <p key={index}>{text}</p>
          ))}
        </details>
      ) : (
        <p className="hint">
          A sample answer isn't available for this task yet.
        </p>
      )}
    </>
  );
}
