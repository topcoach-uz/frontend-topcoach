import React from "react";
import { practiceRelease } from "./listening-library.js";

export function speakingQuestionText(question) {
  return [
    question.prompt,
    ...(question.cuePoints?.length
      ? ["You should say:", ...question.cuePoints]
      : []),
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
export function speakingStorageKey(library) {
  return `speaking:library:${practiceRelease(library)}:${library.topic.id}`;
}
export function ImportedSpeakingPrompt({ library, onSelect, question = 0, onQuestionChange }) {
  const { topic, catalog, part } = library;
  const total = topic.questions.length;
  // Parts 1 and 3 are asked one question at a time; part 2 is a single cue card.
  const stepped = part !== 2 && total > 1 && !!onQuestionChange;
  const index = Math.min(Math.max(question, 0), Math.max(total - 1, 0));
  const visible = stepped ? [[topic.questions[index], index]] : topic.questions.map((q, i) => [q, i]);
  // A single-question topic is titled with that very question; repeating it as a heading is noise.
  const titleRepeatsQuestion =
    total === 1 && topic.questions[0]?.prompt?.trim() === topic.title?.trim();
  return (
    <>
      <h2>PART {part}</h2>
      <p className="muted">
        {topic.testIdentity
          ? `Cambridge ${topic.testIdentity.book} Test ${topic.testIdentity.test}. Questions verified against the source practice page.`
          : "Imported topic bank. These topics are not mapped to Cambridge books or tests."}
      </p>
      <label>
        Practice topic
        <select
          className="match-select"
          aria-label="Practice topic"
          value={topic.id}
          onChange={(e) => onSelect(e.target.value)}
          style={{ width: "100%", minWidth: 0 }}
        >
          {[
            ["cambridge", "This test"],
            ["examiner", "Examiner recordings"],
            ["topics", "Imported topics"],
          ].map(([source, title]) => (
            <optgroup key={source} label={title}>
              {catalog
                .filter((item) => item.source === source)
                .map((item, i) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                    {item.season
                      ? ` — ${item.season}`
                      : source === "topics"
                        ? ` — Variant ${i + 1}`
                        : ""}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>
      {part === 1 && (
        <p>{topic.intro || "The examiner asks you about familiar topics."}</p>
      )}
      {part === 2 && (
        <p>
          {topic.intro ||
            "You have one minute to prepare. Talk about the topic for one to two minutes."}
        </p>
      )}
      {part === 3 && <h2>Discussion topics:</h2>}
      {!titleRepeatsQuestion && <h1>{topic.title}</h1>}
      {stepped && (
        <div className="speaking-stepper">
          <b aria-live="polite">Question {index + 1} of {total}</b>
          <span>
            <button disabled={index === 0} onClick={() => onQuestionChange(index - 1)}>
              Previous
            </button>
            <button disabled={index === total - 1} onClick={() => onQuestionChange(index + 1)}>
              Next
            </button>
          </span>
        </div>
      )}
      <ul className={stepped ? "speaking-single" : undefined}>
        {visible.map(([q, i]) => (
          <li key={i}>
            {q.prompt}
            {!!q.cuePoints.length && (
              <ul>
                {q.cuePoints.map((point, j) => (
                  <li key={j}>{point}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {topic.questions.some(
        (q) => q.ideas.length || q.vocabulary.length || q.sampleAnswer,
      ) && (
        <details>
          <summary>Practice notes and sample answers</summary>
          {topic.questions.map((q, i) => (
            <section key={i}>
              <h3>{q.prompt}</h3>
              {!!q.ideas.length && (
                <ul>
                  {q.ideas.map((idea, j) => (
                    <li key={j}>{idea}</li>
                  ))}
                </ul>
              )}
              {!!q.vocabulary.length && (
                <ul>
                  {q.vocabulary.map((item, j) => (
                    <li key={j}>
                      <b>{item.phrase}</b>
                      {item.meaning && `: ${item.meaning}`}
                    </li>
                  ))}
                </ul>
              )}
              {q.sampleAnswer && <p>{q.sampleAnswer}</p>}
            </section>
          ))}
        </details>
      )}
    </>
  );
}
