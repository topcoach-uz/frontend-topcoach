import React from "react";

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
  return `speaking:library:${library.release}:${library.topic.id}`;
}
export function ImportedSpeakingPrompt({ library, onSelect }) {
  const { topic, catalog, part } = library;
  return (
    <>
      <h2>PART {part}</h2>
      <p className="muted">
        Imported topic bank. These topics are not mapped to Cambridge books or
        tests.
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
      {part === 1 && <p>The examiner asks you about familiar topics.</p>}
      {part === 2 && (
        <p>
          You have one minute to prepare. Talk about the topic for one to two
          minutes.
        </p>
      )}
      {part === 3 && <h2>Discussion topics:</h2>}
      <h1>{topic.title}</h1>
      <ul>
        {topic.questions.map((q, i) => (
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
