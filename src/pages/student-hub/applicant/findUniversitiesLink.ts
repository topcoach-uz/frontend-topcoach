import { applicantLinks } from "src/lib/applicantWorkspace";
import { matchSubjectOption } from "./universityFieldOptions";

/** Link to Find universities, pre-filtered to the catalogue option matching a major name when one exists. */
export function findUniversitiesLink(majorName: string | undefined, options: Array<{ value: string }> | undefined): string {
  const match = majorName && options?.length ? matchSubjectOption(options, majorName) : undefined;
  return match ? `${applicantLinks.universities}?major=${encodeURIComponent(match.value)}` : applicantLinks.universities;
}
