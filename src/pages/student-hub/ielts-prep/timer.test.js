import { describe, expect, test } from "vitest";
import { expiryAction, timingFor } from "./timer.js";

describe("expiryAction", () => {
  test("ignores a missing or running clock", () => {
    expect(expiryAction(null, null, 10)).toBe("none");
    expect(expiryAction({ remaining: 5 }, null, 10)).toBe("none");
    expect(expiryAction({ deadline: 20 }, 20, 10)).toBe("none");
  });
  test("discards a deadline that was already past when first seen", () => {
    expect(expiryAction({ deadline: 5 }, null, 10)).toBe("discard");
    expect(expiryAction({ deadline: 5 }, 99, 10)).toBe("discard");
  });
  test("announces a deadline watched while it was live", () => {
    expect(expiryAction({ deadline: 10 }, 10, 10)).toBe("announce");
  });
});

describe("timingFor", () => {
  test("writing task pages use the task time", () => {
    expect(timingFor("writing", 1).minutes).toBe(20);
    expect(timingFor("writing", 2).minutes).toBe(40);
  });
  test("mock writing keeps 60 minutes", () => {
    expect(timingFor("writing", 1, true).minutes).toBe(60);
  });
  test("other skills and unknown skills", () => {
    expect(timingFor("reading", 1).minutes).toBe(60);
    expect(timingFor("speaking", 1)).toBeNull();
  });
});
