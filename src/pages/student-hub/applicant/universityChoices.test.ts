import { describe, expect, it, vi } from "vitest";
vi.mock("src/lib/i18n/translationUtils", () => ({ getTranslation: (value: string | null | undefined) => value ?? "" }));
import { buildUniversityChoices } from "./universityChoices";
import type { UniversitiesSchema } from "src/app/api/Api";
const row = (id: string, name: string, country = "USA", region = "Cambridge") => ({ id, name, location: { country, region } }) as UniversitiesSchema;
describe("application university choices", () => {
 it("distinguishes normalized duplicate names while retaining every selectable ID", () => {
  const options = buildUniversityChoices([row("a", "Harvard University "), row("b", "Harvard University"), row("c", "Harvard University", "Canada", "Toronto")]);
  expect(new Set(options.map(option => option.label)).size).toBe(3);
  expect(options.map(option => option.value)).toEqual(["a", "b", "c"]);
  expect(options[0].label).toContain("Cambridge, USA");
  expect(options[2].label).toContain("Toronto, Canada");
 });
 it("keeps a unique name concise and trims whitespace", () => {
  expect(buildUniversityChoices([row("a", "Oxford  ")])).toEqual([{ value: "a", label: "Oxford" }]);
 });
});
