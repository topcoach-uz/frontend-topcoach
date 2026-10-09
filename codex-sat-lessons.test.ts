import { describe, expect, it } from "vitest";
import { localTextLessonModules } from "./codex-sat-lessons";
import { filterLocalBank } from "./codex-sat-bank";

describe("collected lessons in the local platform", () => {
  const lessons = localTextLessonModules.flatMap((m) =>
    m.submodules.flatMap((s) => s.lessons),
  );
  it("preserves all 29 lesson bodies and references across eight domains", () => {
    expect(localTextLessonModules).toHaveLength(8);
    expect(lessons).toHaveLength(29);
    expect(new Set(lessons.map((l) => l.id)).size).toBe(29);
    for (const lesson of lessons) {
      expect(lesson.lessonType).toBe("text");
      expect(lesson.textContentHtml).toContain("Worked example 1");
      expect(lesson.textContentHtml).toContain("Worked example 2");
      expect(lesson.textReferences!.length).toBeGreaterThan(0);
      expect(lesson.isDraft).toBe(true);
    }
  });
  it("maps every lesson's practice action to available bank questions", () => {
    for (const lesson of lessons) {
      const params = new URLSearchParams(lesson.textPracticeUrl!.split("?")[1]);
      const result = filterLocalBank(params);
      expect(result.total, lesson.title).toBeGreaterThan(0);
      expect(
        result.items.every(
          (q) =>
            q.skill === params.get("skill") &&
            q.domain === params.get("domain") &&
            q.section === params.get("section"),
        ),
        lesson.title,
      ).toBe(true);
    }
  });
});
