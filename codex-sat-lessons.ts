// Local preview adapter for the collected draft lessons; no database writes.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  CourseModuleDto,
  CourseLessonDto,
} from "./src/app/services/courses";

type DraftLesson = {
  id: string;
  title: string;
  objective: string;
  domain: string;
  section: string;
  skill: string;
  skillCode: string;
  orderIndex: number;
  bodyHtml: string;
  practiceUrl: string;
  published: boolean;
  references: { provider: string; url: string }[];
};
export function loadLocalTextLessons(
  path = resolve(
    process.cwd(),
    "../output/sat-library-research-2026-10-08/lesson-pack.json",
  ),
): CourseModuleDto[] {
  const pack = JSON.parse(readFileSync(path, "utf8")) as {
    lessons: DraftLesson[];
  };
  const groups = new Map<string, CourseModuleDto>();
  for (const draft of pack.lessons) {
    if (!draft.id || !draft.bodyHtml || !draft.domain || !draft.references)
      throw new Error("Malformed lesson draft");
    const moduleId = `text-${draft.section}-${draft.domain.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    if (!groups.has(moduleId))
      groups.set(moduleId, {
        id: moduleId,
        title: draft.domain,
        description: "Text lessons with worked examples and targeted practice.",
        mentorId: "",
        mentor: { id: "", email: "" },
        orderIndex: groups.size,
        estimatedDuration: 0,
        moduleType: "standard",
        isActive: true,
        lessons: [],
        submodules: [],
      });
    const module = groups.get(moduleId)!;
    const submoduleId = `text-topic-${draft.skillCode.replace(/\./g, "-")}`;
    // The local bank normalizes trailing whitespace in skill names.
    const params = new URLSearchParams(draft.practiceUrl.split("?")[1]);
    params.set("skill", draft.skill);
    const lesson: CourseLessonDto = {
      id: draft.id,
      title: draft.title,
      description: draft.objective,
      moduleId,
      submoduleId,
      orderIndex: draft.orderIndex,
      lessonType: "text",
      textContentHtml: draft.bodyHtml,
      textPracticeUrl: `/student-hub/sat-prep/practice?${params}`,
      textReferences: draft.references,
      isDraft: !draft.published,
      duration: 0,
      isActive: true,
      isPremium: false,
      resources: [],
      tasks: [],
    };
    module.submodules.push({
      id: submoduleId,
      title: draft.skill,
      moduleId,
      orderIndex: module.submodules.length,
      isActive: true,
      lessons: [lesson],
    });
  }
  return [...groups.values()];
}
export const localTextLessonModules = loadLocalTextLessons();
