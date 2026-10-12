import React from "react";

// Neutral content fixtures preserve the observed screen structure; the corpus is independent of the UI.
export const extraPassages = {
  2: {
    title: "Why we need silence",
    subtitle: "",
    paragraphs: [
      "A\nSound gives us information about our surroundings. A sudden noise may raise blood pressure, tighten muscles and prepare the body to react. These short responses are useful, but repeated exposure can disrupt sleep and affect long-term health.",
      "B\nNoise is a public-health concern in many crowded cities. International research has compared nighttime sound levels and reported that large numbers of residents experience more noise than recommended. Nick Antonio describes the difficulty of protecting our hearing during ordinary daily activities.",
      "C\nCities can reduce traffic noise by improving road surfaces, making public transport quieter and planting vegetation. Some authorities also regulate loud equipment and modified vehicles. Antonio expects the interest in quieter neighbourhoods to continue growing.",
      "D\nA flotation tank reduces both light and sound while supporting the body in salty water. Justin Feinstein studies this environment. People sometimes report unusual sensory experiences, but concentrating on their breath can help them settle into a relaxed state.",
      "E\nIn one experiment, fifty participants completed a questionnaire before and after a flotation session. They reported less tension and improved wellbeing. A separate investigation compared flotation with resting in a reclining chair. Brain measurements showed changes in networks associated with depression.",
      "F\nTal Dotan Ben-Soussan studies quiet environments and personal attention. She argues that external quiet can help people observe their surroundings and choose an appropriate response. Participation matters: silence imposed on someone who does not want it can feel distressing.",
      "G\nEric Pfeifer suggests that silence should be approached gradually, particularly by people experiencing stress. A quiet garden may be more comfortable than a completely silent room. Frequent short breaks can make quietness a practical part of everyday life.",
    ],
  },
  3: {
    title: "Book review: The World of Sugar by Ulbe Bosma",
    subtitle: "",
    paragraphs: [
      "A global history of sugar connects agriculture, trade and political power. Cane and beet became important commodities in different regions. Subsidies and changing prices influenced which producers could compete in international markets.",
      "Britain obtained sugar from several sources over time. Colonial plantations initially supplied cane. Imports later included producers elsewhere, European beet sugar, and eventually a domestic industry. This changing supply illustrates the geographical range of the book.",
      "Sugar farming did not always take place on large plantations. In some regions small farmers cultivated cane alongside other crops. The work was intensive, and different arrangements required different relationships between growers, workers and traders.",
      "Migrant workers played an important role in large-scale production. Small-scale cultivation also remained common in parts of South Asia and Latin America. Labour conditions and traditional farming practices therefore belong to the same international story.",
      "Powerful individuals and businesses sought protection for their markets. Their interests influenced national governments, which introduced financial controls and trade restrictions. Less wealthy nations often had fewer opportunities to benefit from these arrangements.",
      "Processing sugar required more than farming. Machinery extracted the plant material, and refinement separated the desired product. Rail transport, steam power and factory organisation changed the scale of production and helped techniques move between countries.",
      "Agricultural developments made sugar available in much greater quantities. Its marketing and widespread consumption raised questions about health. High-fructose corn syrup became a common ingredient in processed food, adding another dimension to debates about excessive sweetness.",
      "The reviewer values the book for connecting production with social history. Sugar supplied livelihoods as well as profits, and its consequences were unevenly distributed. The broader lesson concerns how a familiar everyday product can shape lives around the world.",
    ],
  },
};

function Choice({ number, text, options, answers, update }) {
  return (
    <fieldset>
      <legend>
        <b>{number}</b> {text}
      </legend>
      {options.map(([value, label]) => (
        <label key={value}>
          <input
            type="radio"
            name={`answer-${number}`}
            checked={answers[number] === value}
            onChange={() => update(number, value)}
          />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
function Match({ number, answers, update, letters = "ABCDEFG" }) {
  return (
    <span className="answer-inline">
      <span>{number}</span>
      <select
        aria-label={`Answer ${number}`}
        value={answers[number] || ""}
        onChange={(e) => update(number, e.target.value)}
      >
        <option value="">{number}</option>
        {letters.split("").map((letter) => (
          <option key={letter} value={letter}>
            {letter}
          </option>
        ))}
      </select>
    </span>
  );
}

export function ExtraReadingQuestions({ part, input, answers, update }) {
  const match = (n, letters) => (
    <Match number={n} letters={letters} answers={answers} update={update} />
  );
  if (part === 2)
    return (
      <>
        <b>Questions 14–17</b>
        <p>Reading Passage 2 has seven sections, A–G.</p>
        <p>Which section contains the following information?</p>
        <p>
          Choose the correct letter, <b>A–G</b>, in boxes 14–17 on your answer
          sheet.
        </p>
        {[
          "examples of strategies to decrease the noise that the public are exposed to",
          "data indicating the extent of the problem of excessive noise",
          "a description of physiological changes in our bodies when we hear sudden noises",
          "evidence that a relatively quiet environment can be more beneficial than a totally silent one",
        ].map((q, i) => (
          <p key={i}>
            <b>{14 + i}</b> {q} {match(14 + i)}
          </p>
        ))}
        <b>Questions 18–21</b>
        <p>
          Complete the summary below. Choose <b>ONE WORD ONLY</b> from the
          passage for each answer.
        </p>
        <div className="question-box">
          <h2 className="center">Flotation Tanks</h2>
          <p>
            According to Justin Feinstein, flotation tanks allow people to
            concentrate on their own {input(18)}, which helps them relax and
            enables them to meditate.
          </p>
          <p>
            Before and after a flotation session, fifty participants completed a{" "}
            {input(19)}. They later described greater relaxation and improved
            general {input(20)}.
          </p>
          <p>
            Another experiment found reduced brain activity in areas associated
            with {input(21)}.
          </p>
        </div>
        <b>Questions 22–26</b>
        <p>
          Match each statement with the correct person, <b>A–D</b>.
        </p>
        <p>
          <i>
            <b>NB</b> You may use any letter more than once.
          </i>
        </p>
        <div className="question-box">
          <h2 className="center">List of People</h2>
          {[
            "Nick Antonio",
            "Justin Feinstein",
            "Tal Dotan Ben-Soussan",
            "Eric Pfeifer",
          ].map((name, i) => (
            <p key={name}>
              {"ABCD"[i]}. {name}
            </p>
          ))}
        </div>
        {[
          "It is unpleasant and upsetting for people to be placed in a silent environment against their will.",
          "The trend towards creating quieter urban locations is likely to increase in the coming years.",
          "When our senses are deprived of input, our minds compensate by creating apparent images and sounds.",
          "Even a short amount of silent time can have a positive impact.",
          "External and internal quietness makes us more conscious of our surroundings.",
        ].map((q, i) => (
          <p key={i}>
            <b>{22 + i}</b> {q} {match(22 + i, "ABCD")}
          </p>
        ))}
      </>
    );
  const questions = [
    [
      "What does the reviewer suggest about the cultivation and trading of sugar in the first paragraph?",
      [
        "Sugar has played a major role in international relations.",
        "Beet sugar has been made more internationally competitive.",
        "Cane sugar is thought to be of superior quality to beet sugar.",
        "New locations for cultivating sugar have increased production.",
      ],
    ],
    [
      "When discussing the sugar market in Britain, the reviewer stresses",
      [
        "how the sources used changed over time.",
        "how developments in agriculture affected trade.",
        "the increased demand for sugar over the years.",
        "the growing support for ethical methods of cultivation.",
      ],
    ],
    [
      "What is the reviewer doing in the third paragraph?",
      [
        "describing an efficient approach to sugar cultivation",
        "explaining why the use of sugar plantations declined",
        "addressing a misconception about the growing of cane",
        "evaluating different approaches to the cultivation of sugar cane",
      ],
    ],
    [
      "What does the reviewer suggest is the overall message of the book?",
      [
        "Sugar is a harmful and unnecessary product.",
        "Economic pressure is needed to control sugar production.",
        "Conditions for workers in sugar production should be improved.",
        "Intensive marketing of sugar has had disastrous consequences.",
      ],
    ],
  ];
  return (
    <>
      <b>Questions 27–30</b>
      <p>
        Choose the correct letter, <b>A, B, C or D</b>.
      </p>
      {questions.map(([text, options], i) => (
        <Choice
          key={i}
          number={27 + i}
          text={text}
          options={options.map((label, j) => [
            "ABCD"[j],
            `${"ABCD"[j]}. ${label}`,
          ])}
          answers={answers}
          update={update}
        />
      ))}
      <b>Questions 31–36</b>
      <p>Complete the summary using the list of words or phrases below.</p>
      <p>
        Choose the correct letter, <b>A–I</b>, in boxes 31–36 on your answer
        sheet.
      </p>
      <div className="question-box">
        {[
          "national governments",
          "agricultural developments",
          "less wealthy nations",
          "untrained workers",
          "small-scale cultivation",
          "outdated methods",
          "financial controls",
          "migrant workers",
          "powerful individuals and businesses",
        ].map((text, i) => (
          <p key={text}>
            {"ABCDEFGHI"[i]}. {text}
          </p>
        ))}
      </div>
      <h2 className="center">Sugar cultivation and production</h2>
      <p>
        Large-scale sugar farming relied on {match(31, "ABCDEFGHI")}. In other
        regions, {match(32, "ABCDEFGHI")} continued.
      </p>
      <p>
        Production involved {match(33, "ABCDEFGHI")} who protected their markets
        and influenced {match(34, "ABCDEFGHI")}.
      </p>
      <p>
        To support producers, {match(35, "ABCDEFGHI")} were established, while{" "}
        {match(36, "ABCDEFGHI")} were penalised.
      </p>
      <b>Questions 37–40</b>
      <p>Do the following statements agree with the claims of the writer?</p>
      <p>
        <b>YES</b> if the statement agrees
        <br />
        <b>NO</b> if it contradicts the claims
        <br />
        <b>NOT GIVEN</b> if it is impossible to say
      </p>
      {[
        "Sugar has now become available in large quantities due to a range of agricultural developments.",
        "Advertisers initially marketed sugar as a luxury product.",
        "The invention of high-fructose corn syrup was a positive development.",
        "High-fructose corn syrup is an ingredient in many processed foods.",
      ].map((text, i) => (
        <Choice
          key={i}
          number={37 + i}
          text={text}
          options={["YES", "NO", "NOT GIVEN"].map((x) => [x, x])}
          answers={answers}
          update={update}
        />
      ))}
    </>
  );
}
