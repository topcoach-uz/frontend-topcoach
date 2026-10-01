export function parseApplicantDate(value: string) {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return new Date(value);
}

export function displayApplicantDate(value?: string | null) {
  if (!value) return "Not set";
  const date = parseApplicantDate(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}
