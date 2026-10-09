import { defineConfig, mergeConfig } from "vite";
import original from "./vite.config";
import {
  localSatBank,
  localAggregateCounts,
  localSkillCounts,
  filterLocalBank,
  composeLocalMock,
} from "./codex-sat-bank";
import { localTextLessonModules } from "./codex-sat-lessons";
const structure = localTextLessonModules;
const progress = {
  totalLessons: 29,
  completedLessons: 0,
  totalTimeWatched: 0,
  overallProgress: 0,
  lastWatchedAt: null,
  progress: [],
};
const skills = [
  {
    section: "math",
    domain: "Algebra",
    skill: "Linear functions",
    attempts: 21,
    correct: 13,
    pct: 62,
  },
  {
    section: "math",
    domain: "Advanced Math",
    skill: "Nonlinear equations",
    attempts: 25,
    correct: 17,
    pct: 68,
  },
  {
    section: "reading-writing",
    domain: "Standard English Conventions",
    skill: "Boundaries",
    attempts: 28,
    correct: 20,
    pct: 71,
  },
];
const sessions = [
  {
    id: "math-1",
    mode: "mock",
    section: "math",
    mockId: "mock-1-math",
    title: "Math Mock Test 1",
    totalQ: 44,
    correctQ: 33,
    durationSec: 4200,
    completedAt: "2026-10-06T12:00:00Z",
    estimatedScore: 650,
  },
  {
    id: "rw-1",
    mode: "mock",
    section: "reading-writing",
    mockId: "mock-1-rw",
    title: "Reading & Writing Mock Test 1",
    totalQ: 54,
    correctQ: 40,
    durationSec: 3840,
    completedAt: "2026-10-05T12:00:00Z",
    estimatedScore: 630,
  },
];
const satProgress = {
  personalBest: {
    score: 650,
    title: "Math Mock Test 1",
    completedAt: sessions[0].completedAt,
  },
  lastSession: sessions[0],
  streak: { count: 3, lastPracticeDate: "2026-10-06" },
  focusArea: skills[0],
  masteryRows: skills,
  recentSessions: sessions,
  mockSessions: sessions,
  packSessions: [],
};
const savedQuestion = localSatBank.find(
  (q) => q.section === "math" && q.skill === "Linear functions",
)!;
const sampleSavedQuestions = [
  savedQuestion,
  localSatBank.find((q) => q.questionId === "a064955f")!,
  localSatBank.find((q) => q.questionId === "TC-RW-001")!,
];
export default mergeConfig(
  original,
  defineConfig({
    cacheDir: "node_modules/.vite-sat-preview",
    server: { host: "127.0.0.1", port: 5186, proxy: {} },
    plugins: [
      {
        name: "local-comparison-data",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (
              req.url?.startsWith("/student-hub/") ||
              req.url?.startsWith("/learning")
            ) {
              req.url = "/codex-sat-comparison.html";
              return next();
            }
            if (!req.url?.startsWith("/api")) return next();
            let data: any = [];
            if (req.url.includes("/mock-test") && req.method === "POST") {
              let body = "";
              req.on("data", (chunk) => (body += chunk));
              req.on("end", () => {
                try {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(composeLocalMock(JSON.parse(body))));
                } catch {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ message: "Invalid mock request" }));
                }
              });
              return;
            }
            if (req.url.includes("/filter"))
              data = filterLocalBank(
                new URL(req.url, "http://localhost").searchParams,
              );
            else if (req.url.includes("/skill-counts")) data = localSkillCounts;
            else if (req.url.includes("/library/vocabulary"))
              data = [
                {
                  id: "word-1",
                  word: "infer",
                  normalizedWord: "infer",
                  questionId: null,
                  contextHtml: null,
                  createdAt: "2026-10-06T12:00:00Z",
                },
              ];
            else if (req.url.includes("/library/marked/ids"))
              data = sampleSavedQuestions.map((q) => q.questionId);
            else if (req.url.includes("/library/marked"))
              data = sampleSavedQuestions.map((question, index) => ({
                id: `mark-${index + 1}`,
                questionId: question.questionId,
                note: null,
                createdAt: "2026-10-06T12:00:00Z",
                question,
              }));
            else if (req.url.includes("enrollment-status"))
              data = {
                isEnrolled: true,
                canAccessLearning: true,
                enrollment: { courseName: "sat", paymentStatus: "approved" },
              };
            else if (req.url.includes("learning/structure")) data = structure;
            else if (req.url.includes("learning/progress")) data = progress;
            else if (req.url.includes("progress/me")) data = satProgress;
            else if (req.url.includes("aggregate-counts"))
              data = localAggregateCounts;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
          });
        },
      },
    ],
  }),
);
