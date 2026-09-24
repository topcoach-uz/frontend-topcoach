import { describe, expect, it } from "vitest";
import {
  normalizeUniversityList,
  universityListParams,
} from "./universityQuery";

describe("universityListParams", () => {
  it("maps UI paging to the university catalogue contract", () => {
    expect(
      universityListParams({ page: 3, limit: 40, search: "  Oxford  " }),
    ).toEqual({
      _start: 80,
      _end: 120,
      _sort: 'rankings',
      name: "Oxford",
    });
  });

  it("omits an empty name filter", () => {
    expect(universityListParams({ page: 1, limit: 20, search: " " })).toEqual({
      _start: 0,
      _end: 20,
      _sort: 'rankings',
    });
  });

  it("passes bachelor catalogue filters to the backend", () => {
    expect(universityListParams({
      page: 1,
      limit: 40,
      majorName: "Computer science",
      country: "United Kingdom",
      majorType: "undergraduate",
    })).toEqual({
      _start: 0,
      _end: 40,
      _sort: 'rankings',
      majorName: "Computer science",
      country: "United Kingdom",
      majorType: "undergraduate",
    });
  });
});

describe("normalizeUniversityList", () => {
  it("keeps the backend data and total envelope", () => {
    expect(
      normalizeUniversityList({ data: [{ id: "u1" }], total: 27 }),
    ).toEqual({ data: [{ id: "u1" }], total: 27 });
  });

  it("accepts the legacy array response", () => {
    expect(normalizeUniversityList([{ id: "u1" }])).toEqual({
      data: [{ id: "u1" }],
      total: 1,
    });
  });
});
