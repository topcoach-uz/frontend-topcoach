import React from "react";
export function ExtraListeningQuestions({
  part,
  input,
  answers,
  update,
  updateGroup,
}) {
  const start = (part - 1) * 10 + 1,
    end = part * 10;
  if (part === 2)
    return (
      <>
        <b>Questions 11–16</b>
        <p>
          Choose the correct letter, <b>A, B or C</b>.
        </p>
        {Array.from({ length: 6 }, (_, i) => 11 + i).map((n) => (
          <fieldset key={n}>
            <legend>
              <b>{n}</b>{" "}
              {
                [
                  "What is the main purpose of the visit?",
                  "Which activity is available in the morning?",
                  "Where should visitors meet?",
                  "What is included in the ticket?",
                  "Which service is recommended?",
                  "What should participants bring?",
                ][n - 11]
              }
            </legend>
            {["A", "B", "C"].map((value, i) => (
              <label key={value}>
                <input
                  type="radio"
                  name={`answer-${n}`}
                  checked={answers[n] === value}
                  onChange={() => update(n, value)}
                />
                {value}.{" "}
                {
                  [
                    "A guided tour",
                    "A practical workshop",
                    "An independent visit",
                  ][i]
                }
              </label>
            ))}
          </fieldset>
        ))}
        <b>Questions 17–20</b>
        <p>
          Match each activity with the correct location, <b>A–H</b>.
        </p>
        {Array.from({ length: 4 }, (_, i) => 17 + i).map((n) => (
          <p key={n}>
            <b>{n}</b> Activity {n - 16}{" "}
            <select
              className="match-select"
              aria-label={`Answer ${n}`}
              value={answers[n] || ""}
              onChange={(e) => update(n, e.target.value)}
            >
              <option value="">{n}</option>
              {"ABCDEFGH".split("").map((letter) => (
                <option key={letter}>{letter}</option>
              ))}
            </select>
          </p>
        ))}
      </>
    );
  if (part === 3)
    return (
      <>
        {[
          [
            "Which TWO factors do the students discuss?",
            [
              "social media",
              "smaller families",
              "urban design",
              "longer lifespans",
              "a mobile workforce",
            ],
          ],
          [
            "Which TWO risks are mentioned in the discussion?",
            [
              "a weakened immune system",
              "dementia",
              "cancer",
              "obesity",
              "cardiovascular disease",
            ],
          ],
          [
            "Which TWO opinions are shared by both students?",
            [
              "It has little practical relevance.",
              "It needs further investigation.",
              "It is misleading.",
              "It should be more widely accepted.",
              "It is difficult to understand.",
            ],
          ],
        ].map(([question, options], group) => {
          const first = 21 + group * 2,
            selected = [answers[first], answers[first + 1]].filter(Boolean);
          return (
            <React.Fragment key={first}>
              <b>
                Questions {first} and {first + 1}
              </b>
              <p>
                Choose <b>TWO</b> letters, <b>A–E</b>.
              </p>
              <fieldset className="choice-group">
                <legend>
                  <b>
                    {first}–{first + 1}
                  </b>{" "}
                  {question}
                </legend>
                {options.map((text, i) => {
                  const value = "ABCDE"[i],
                    checked = selected.includes(value);
                  return (
                    <label key={value}>
                      <input
                        type="checkbox"
                        aria-label={`${value}. ${text}`}
                        checked={checked}
                        disabled={!checked && selected.length === 2}
                        onChange={(e) =>
                          updateGroup(
                            first,
                            e.target.checked
                              ? [...selected, value]
                              : selected.filter((v) => v !== value),
                          )
                        }
                      />
                      {value}. {text}
                    </label>
                  );
                })}
              </fieldset>
            </React.Fragment>
          );
        })}
        <b>Questions 27–30</b>
        <p>
          Choose the correct letter, <b>A, B or C</b>.
        </p>
        <h2 className="center">Loneliness and mental health</h2>
        {[
          "How do the students compare two experiences?",
          "Why do they use a personal example?",
          "Which strategy do the students discuss?",
          "What do they find difficult to understand?",
        ].map((question, i) => (
          <fieldset key={i}>
            <legend>
              <b>{27 + i}</b> {question}
            </legend>
            {["A", "B", "C"].map((value, j) => (
              <label key={value}>
                <input
                  type="radio"
                  name={`answer-${27 + i}`}
                  checked={answers[27 + i] === value}
                  onChange={() => update(27 + i, value)}
                />
                {value}.{" "}
                {
                  [
                    "The first explanation",
                    "A contrasting point of view",
                    "A practical example",
                  ][j]
                }
              </label>
            ))}
          </fieldset>
        ))}
      </>
    );

  return (
    <>
      <b>Questions 31–40</b>
      <p>Complete the notes below.</p>
      <p>
        Write <b>ONE WORD ONLY</b> for each answer.
      </p>
      <div className="question-box">
        <h2 className="center">Materials and the environment</h2>
        {[
          "The material contains several types of ___ .",
          "The process is relatively ___ .",
          "The research considers changes in ___ .",
          "Some resources are found near the ___ .",
          "One approach is to ___ used materials.",
          "The experiment includes a type of ___ .",
          "The outcome depends on the ___ .",
          "The structure needs to be ___ .",
          "Researchers examine the plant’s ___ .",
          "The results are affected by the ___ .",
        ].map((text, i) => {
          const [before, after] = text.split("___");
          return (
            <p key={i}>
              {before}
              {input(31 + i)}
              {after}
            </p>
          );
        })}
      </div>
    </>
  );
}
