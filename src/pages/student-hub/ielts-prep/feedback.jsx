import React from "react";

export function WritingFeedback({ essay }) {
  return (
    <div className="assessment">
      <small className="fixture-label">Sample feedback · UI preview</small>
      <div className="band-value">6.5</div>
      <div className="submitted-text">
        {essay ||
          "The chart compares employment across four industries over a period of sixty years."}
      </div>
      {[
        [
          "Task response",
          "The response identifies the main trends and provides a useful overview. A fuller comparison of the beginning and ending values would make the summary more precise.",
          "Key Points",
          [
            "Include an overview before the detailed comparisons.",
            "Select the most significant changes rather than describing every value.",
          ],
        ],
        [
          "Coherence and Cohesion",
          "The paragraphs follow a clear order. Some connections between the comparisons could be made more explicit.",
          "Linking Issues",
          [
            "Use a linking phrase to signal the contrast between rising and falling trends.",
          ],
        ],
        [
          "Lexical Resource",
          "The vocabulary communicates the main ideas. More variation would help avoid repeating the same words.",
          "Vocabulary Suggestions",
          ["Compare “increased steadily” with “rose throughout the period.”"],
        ],
        [
          "Grammatical Range and Accuracy",
          "The sentences are generally clear. Review tense consistency and vary sentence structure.",
          "Grammatical Errors",
          ["Use past tense consistently when describing the completed period."],
        ],
      ].map(([title, review, issue, items]) => (
        <section className="criterion" key={title}>
          <h3>{title}</h3>
          <p>{review}</p>
          <h4>{issue}</h4>
          <ul>
            {items.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </section>
      ))}
      <section className="criterion">
        <h3>Band Score</h3>
        <div className="band-value">6.5</div>
      </section>
      <section className="criterion">
        <h3>Overall Review</h3>
        <p>
          The summary is easy to follow. Develop the comparison between the
          sectors and check the precision of numerical descriptions.
        </p>
      </section>
      <section className="criterion">
        <h3>Optimized Composition</h3>
        <p>
          The chart compares changes in employment across manufacturing, retail,
          agriculture and healthcare in the United States from 1960 to 2020.
        </p>
        <p>
          Overall, healthcare expanded throughout the period and became the
          largest of the four employers. Manufacturing peaked early before
          declining, while agriculture lost jobs. Retail also grew, although its
          expansion slowed in the final decades.
        </p>
      </section>
    </div>
  );
}

export function SpeakingFeedback({ questions }) {
  const answers = [
    "I usually visit a small local salon. The staff know how I like my hair, and I find it easy to make an appointment.",
    "My preferences have changed over time, but I still choose styles that are comfortable and easy to maintain.",
    "I would consider a change if it suited me, although I would ask for advice before deciding.",
    "I enjoy the chance to relax and have a conversation while someone takes care of my hair.",
  ];
  return (
    <div className="assessment">
      <small className="fixture-label">Sample feedback · UI preview</small>
      <h2>Speaking feedback</h2>
      <div className="band-value">6.5</div>
      <section className="criterion">
        <h3>Comments</h3>
        {questions.map((question, i) => (
          <article className="spoken-review" key={question}>
            <div>
              <b className="qa-tag">Q</b>
              <p>{question}</p>
            </div>
            <div>
              <b className="qa-tag answer-tag">A</b>
              <p>{answers[i % answers.length]}</p>
            </div>
            <h4>Quick Thoughts</h4>
            <p>
              The answer expresses a clear preference and gives a reason. Add a
              specific example to make it more detailed.
            </p>
            <p className="improved-answer">
              <b>You might also say:</b> I prefer a familiar place because I can
              explain what I want and feel confident about the result.
            </p>
          </article>
        ))}
      </section>
      <section className="criterion">
        <h3>Overall Review</h3>
        <p>
          The responses communicate ideas clearly. Develop each answer with a
          reason or example and practise using a wider range of expressions.
        </p>
      </section>
      <section className="criterion">
        <h3>Band Score</h3>
        <div className="band-value">6.5</div>
        <p className="scoring-note">
          * Since key IELTS Speaking criteria (e.g., Pronunciation) are not
          included, the Band Score here is for practice reference only and not
          formal scoring guidance.
        </p>
      </section>
    </div>
  );
}
