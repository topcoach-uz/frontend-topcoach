import { ACCESS_TOKEN } from "src/constants/storage";
import { baseUrl } from "./api/const";

/** Fetch with the existing session token; never put credentials into a link. */
export async function downloadProgramReport(
  enrollmentId: string,
  audience: "mentor" | "my",
  name: string,
): Promise<void> {
  const token = localStorage.getItem(ACCESS_TOKEN);
  const response = await fetch(
    `${baseUrl}/academic-programs/${audience}/enrollments/${encodeURIComponent(enrollmentId)}/report?format=pdf`,
    {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    },
  );
  if (!response.ok) throw new Error("Could not download the program report");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${name.replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 100) || "TopCoach program"} report.pdf`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
