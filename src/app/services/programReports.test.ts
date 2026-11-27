import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("src/constants/storage", () => ({
  ACCESS_TOKEN: "TOP_COACH_ACCESS_TOKEN",
}));
import { downloadProgramReport } from "./programReports";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
describe("authenticated program report downloads", () => {
  it("downloads the exact mentor enrollment with credentials only in headers", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, blob: async () => new Blob(["pdf"]) });
    const click = vi.fn();
    const anchor = { href: "", download: "", click };
    vi.stubGlobal("localStorage", { getItem: () => "private-token" });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("document", { createElement: () => anchor });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:report");
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    await downloadProgramReport(
      "research/renewal",
      "mentor",
      "TopCoach Research",
    );
    expect(fetchMock.mock.calls[0][0]).toMatch(
      /\/academic-programs\/mentor\/enrollments\/research%2Frenewal\/report\?format=pdf$/,
    );
    expect(fetchMock.mock.calls[0][0]).not.toContain("private-token");
    expect(fetchMock.mock.calls[0][1].headers.authorization).toBe(
      "Bearer private-token",
    );
    expect(click).toHaveBeenCalledOnce();
    expect(anchor.download).toBe("TopCoach Research report.pdf");
    await vi.runAllTimersAsync();
    expect(revoke).toHaveBeenCalledWith("blob:report");
  });
  it("does not create a download after server denies access", async () => {
    vi.stubGlobal("localStorage", { getItem: () => null });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 403 }),
    );
    await expect(
      downloadProgramReport("other-enrollment", "my", "Private"),
    ).rejects.toThrow("Could not download");
  });
});
