import React from "react";

export const generalPassages = {
  1: {
    title: "Castle Road Run",
    subtitle: "",
    paragraphs: [
      "The annual road run welcomes runners of different levels. Registration details, event choice and shirt size are included on a card sent before race day.",
      "Bring the registration card when collecting a race number. Returning runners in their fifth event use green numbers; other participants have red numbers. Complete the questionnaire on the card to help the organisers improve future events.",
      "Changes between the full and half distance may be requested by email until 28 October. Additional entry costs apply when increasing the distance.",
      "Safety requirements limit the number of participants. Entries beyond the limit are refunded.",
      "Collect the race pack at North Lake Hotel before the event. Runners travelling from outside the area should contact the Race Manager to arrange collection.",
      "A runner collecting another person’s pack must also bring that person’s registration card.",
    ],
  },
  2: {
    title: "Hatcliff Backpackers",
    subtitle: "",
    paragraphs: [
      "The hostel is near the city centre, with public transport and shops within walking distance. Guests can choose shared rooms or private accommodation.",
      "Rooms include storage space for travellers’ belongings. Contact reception to discuss changes to a reservation or arrange storage while visiting another destination.",
      "Staff can help guests plan trips and book transport. An airport transfer is available once per visitor, either on arrival or departure.",
      "Give the hostel at least twenty-four hours’ notice when requesting transport or making accommodation arrangements.",
    ],
  },
  3: {
    title: "Job openings for sales clerks",
    subtitle: "",
    paragraphs: [
      "A tea retailer is recruiting staff for new stores. Applicants should be punctual, maintain a neat appearance and be flexible about their work schedules.",
      "Good English is needed for conversations with customers. Additional languages may be useful when explaining products to visitors.",
      "Staff approach their duties with urgency and work without friction alongside colleagues. Coaching helps employees develop confidence and improve their service.",
      "The role contributes to sales growth, introduces customers to different teas, maintains stock and reports shortages to the team leader. Handling money and keeping work areas clean must follow company policy.",
    ],
  },
  4: {
    title: "Forklift operator course",
    subtitle: "",
    paragraphs: [
      "Training prepares operators to use equipment safely and meet legal requirements. A structured course combines classroom learning with supervised practice.",
      "Participants receive an explanation of vehicle components and practise moving loads. A heavy load can be a challenge for a new driver, so instructors pay particular attention to this task.",
      "Students learn to identify dangerous goods and respond to a spill. They also practise strategies for narrow aisles and other confined spaces.",
      "An inspection before each shift helps identify worn parts and other hazards. The final assessment includes a written exam and a practical demonstration.",
    ],
  },
  5: {
    title: "The lure of diving",
    subtitle: "",
    paragraphs: [
      "A\nDiving allows people to explore an environment that is usually hidden from everyday view. Equipment and training make it possible to remain underwater safely for a limited period.",
      "B\nTravelling divers can choose from many locations. Researching the conditions and the features of a site helps them decide whether it matches their experience and interests.",
      "C\nPhotography offers another reason to explore. Water changes the appearance of light and colour, so photographers may need suitable lighting and careful preparation.",
      "D\nSome underwater work involves inspection, repair or scientific research. Such tasks require additional skills and reliable safety procedures.",
      "E\nEquipment has changed considerably over time. Early systems depended on different arrangements for supplying air, while modern systems give divers greater freedom of movement.",
      "F\nLearning the limits of the equipment is part of learning to dive. A responsible diver plans the visit, checks the conditions and remains aware of other members of the group.",
      "G\nThe attraction of diving combines curiosity with skill. Good preparation helps people enjoy the experience while respecting the environment they have come to explore.",
    ],
  },
};
const ranges = [
  [1, 7],
  [8, 14],
  [15, 20],
  [21, 27],
  [28, 40],
];
export function GeneralReadingQuestions({ part, input, answers, update }) {
  const [start, end] = ranges[part - 1];
  if (part === 1) {
    const questions = [
      "What colour identifies a runner taking part for the fourth time?",
      "What can runners complete to help improve future events?",
      "What is the deadline for changing the distance?",
      "How should runners send a change request?",
      "Why is the number of entrants limited?",
      "What should runners collect at the hotel?",
      "Who should visitors contact to arrange collection?",
    ];
    return (
      <>
        <b>Questions 1–7</b>
        <p>Answer the questions below.</p>
        <p>
          Choose <b>NO MORE THAN THREE WORDS AND/OR A NUMBER</b> from the
          passage for each answer.
        </p>
        <p>Write your answers in boxes 1–7 on your answer sheet.</p>
        {questions.map((q, i) => (
          <div className="short-answer" key={i}>
            <p>{q}</p>
            {input(i + 1)}
          </div>
        ))}
      </>
    );
  }
  if (part === 3)
    return (
      <>
        <b>Questions 15–20</b>
        <p>Complete the notes below.</p>
        <p>
          Choose <b>ONE WORD ONLY</b> from the passage for each answer.
        </p>
        <div className="question-box">
          <h2 className="center">Sales clerk job</h2>
          <b>Expectations of employees:</b>
          <ul>
            <li>be on time and have a tidy {input(15)}</li>
            <li>must be {input(16)} with work schedules</li>
            <li>need to have good English</li>
          </ul>
          <b>Employee attitude:</b>
          <ul>
            <li>perform duties with {input(17)}</li>
            <li>avoid {input(18)} with other staff</li>
            <li>respond to coaching in a positive way</li>
          </ul>
          <b>Job duties include:</b>
          <ul>
            <li>meeting sales goals to achieve {input(19)}</li>
            <li>explaining the tea world to customers</li>
            <li>reporting {input(20)} of supplies</li>
            <li>handling money according to company policy</li>
          </ul>
        </div>
      </>
    );
  if (part === 4)
    return (
      <>
        <b>Questions 21–27</b>
        <p>Complete the sentences below.</p>
        <p>
          Choose <b>ONE WORD ONLY</b> from the passage for each answer.
        </p>
        {[
          "Legal requirements help ensure the ___ of drivers and others.",
          "Fast-paced training improves the ___ of information.",
          "The course provides an ___ of the vehicle components.",
          "Moving a heavy load can be a ___ for a new operator.",
          "Students learn how to respond to a ___ involving dangerous goods.",
          "Operators practise ___ for working in confined spaces.",
          "A regular vehicle ___ is an important precaution.",
        ].map((q, i) => {
          const [before, after] = q.split("___");
          return (
            <p key={i}>
              <b>{21 + i}</b> {before}
              {input(21 + i)}
              {after}
            </p>
          );
        })}
      </>
    );
  const statements =
    part === 2
      ? [
          "The hostel is conveniently located.",
          "Rooms offer limited storage.",
          "Guests can generally request reservation changes.",
          "Storage is available while guests travel elsewhere.",
          "Reception is staffed twenty-four hours a day.",
          "Free transfers are provided both on arrival and departure.",
          "Staff help guests plan travel and leisure activities.",
        ]
      : [
          "Diving can be explored at a range of destinations.",
          "Special lighting can assist underwater photography.",
          "Preparing for a site visit can improve the experience.",
          "Demand for underwater workers has increased.",
          "Early diving equipment was developed to investigate shipwrecks.",
          "People were initially cautious about new equipment.",
          "Air supplies have been carried in the same way throughout diving history.",
          "Planning helps divers understand the conditions they may encounter.",
        ];
  return (
    <>
      {part === 5 && (
        <>
          <b>Questions 28–32</b>
          <p>Complete the notes below.</p>
          <p>
            Choose <b>NO MORE THAN THREE WORDS</b> from the passage for each
            answer.
          </p>
          <div className="question-box">
            <h2 className="center">How to dive with the minimum of risk</h2>
            {[
              "Take some ___ for other divers.",
              "Keep to the ___ covered in training.",
              "The activity requires someone who is ___ .",
              "Know how to use your ___ effectively.",
              "Understand the effects of temperature and ___ .",
            ].map((text, i) => {
              const [before, after] = text.split("___");
              return (
                <p key={i}>
                  {before}
                  {input(28 + i)}
                  {after}
                </p>
              );
            })}
          </div>
        </>
      )}
      <b>
        Questions {part === 2 ? start : 33}–{end}
      </b>
      <p>
        Do the following statements agree with the information in the passage?
      </p>
      <p>
        <b>TRUE</b> if it agrees
        <br />
        <b>FALSE</b> if it contradicts the information
        <br />
        <b>NOT GIVEN</b> if there is no information
      </p>
      {statements.map((text, i) => (
        <fieldset key={i}>
          <legend>
            <b>{(part === 2 ? 8 : 33) + i}</b> {text}
          </legend>
          {["TRUE", "FALSE", "NOT GIVEN"].map((value) => (
            <label key={value}>
              <input
                type="radio"
                name={`q${(part === 2 ? 8 : 33) + i}`}
                checked={answers[(part === 2 ? 8 : 33) + i] === value}
                onChange={() => update((part === 2 ? 8 : 33) + i, value)}
              />
              {value}
            </label>
          ))}
        </fieldset>
      ))}
    </>
  );
}
