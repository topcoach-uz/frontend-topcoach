export const skills = ["listening", "reading", "writing", "speaking"];
export function practicePartCount(r) {
  if (r.skill === "listening") return 4;
  if (r.skill === "writing") return 2;
  if (r.type === "general-training" && r.skill === "reading")
    return String(r.book) === "17" && Number(r.test) === 1 ? 6 : 5;
  return 3;
}
export function route(path) {
  path = path.split("?")[0];
  const m = path.match(
    /^\/ielts\/practice\/(academic|general-training)\/([^/]+)\/([1-8])\/(listening|reading|writing|speaking|score)(?:\/([1-6]))?$/,
  );
  const validBook =
    m &&
    (m[1] === "academic"
      ? ["eg", "og"].includes(m[2]) || (+m[2] >= 1 && +m[2] <= 21)
      : (+m[2] >= 14 && +m[2] <= 21) || m[2] === "10");
  const validSkill = !!m;
  const maxPart = practicePartCount({ type: m?.[1], book: m?.[2], test: Number(m?.[3]), skill: m?.[4] });
  return m &&
    validBook &&
    validSkill &&
    +(m[5] || 1) <= maxPart &&
    +m[3] <=
      (m[2] === "og" ? 8 : m[1] === "general-training" && m[2] === "10" ? 2 : 4)
    ? { type: m[1], book: m[2], test: +m[3], skill: m[4], part: +(m[5] || 1) }
    : null;
}
export function testPath(r, skill = r.skill, part = 1) {
  return `/ielts/practice/${r.type}/${r.book}/${r.test}/${skill}${skill === "score" ? "" : `/${part}`}`;
}
export function normalize(s) {
  return String(s ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
export function isCorrect(answer, key) {
  return (
    !!normalize(answer) &&
    key.split("|").some((v) => normalize(v) === normalize(answer))
  );
}
export function grade(answers, keys) {
  return keys.reduce((n, k, i) => n + Number(isCorrect(answers[i + 1], k)), 0);
}
export function band(correct) {
  const cutoffs = [
    [39, 9],
    [37, 8.5],
    [35, 8],
    [33, 7.5],
    [30, 7],
    [27, 6.5],
    [23, 6],
    [19, 5.5],
    [15, 5],
    [13, 4.5],
    [10, 4],
    [6, 3.5],
    [4, 3],
    [2, 2.5],
    [1, 1],
  ];
  return cutoffs.find(([n]) => correct >= n)?.[1] || 0;
}
export function wordCount(s) {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}
export function storageKey(r) {
  return `workspace:${r.type}:${r.book}:${r.test}:${r.skill}`;
}
export function partRange(r) {
  const ranges =
    r.skill === "listening"
      ? [
          [0, 10],
          [10, 20],
          [20, 30],
          [30, 40],
        ]
      : r.type === "general-training"
        ? String(r.book) === "17" && Number(r.test) === 1
          ? [[0, 5], [5, 10], [10, 14], [14, 20], [20, 27], [27, 40]]
          : [
            [0, 7],
            [7, 14],
            [14, 20],
            [20, 27],
            [27, 40],
          ]
        : [
            [0, 13],
            [13, 26],
            [26, 40],
          ];
  return ranges[r.part - 1] || [0, 0];
}
export function partForQuestion(r, number) {
  const count = practicePartCount(r);
  for (let part = 1; part <= count; part++) {
    const [start, end] = partRange({ ...r, part });
    if (number > start && number <= end) return part;
  }
  return 1;
}
export function pairAnswers(selected, start) {
  const letters = [...new Set(selected)].sort();
  if (letters.length > 2)
    throw new RangeError("A two-answer group accepts at most two selections");
  return { [start]: letters[0] || "", [start + 1]: letters[1] || "" };
}
export function hasAnswer(value) {
  return normalize(value).length > 0;
}
export function answerStats(answers, keys = []) {
  const stats = { correct: 0, incorrect: 0, unanswered: 0 };
  keys.forEach((key, i) => {
    const answer = answers[i + 1];
    if (!hasAnswer(answer)) stats.unanswered++;
    else if (isCorrect(answer, key)) stats.correct++;
    else stats.incorrect++;
  });
  return stats;
}
