const LIST = "/student-hub/applications";
export function applicationListReturnTo(state: unknown) {
  const value =
    state && typeof state === "object" && "applicationListReturnTo" in state
      ? state.applicationListReturnTo
      : undefined;
  return typeof value === "string" &&
    (value === LIST || value.startsWith(`${LIST}?`))
    ? value
    : LIST;
}
export function updateApplicationListParams(
  previous: URLSearchParams,
  values: Record<string, string>,
) {
  const next = new URLSearchParams(previous);
  const defaults: Record<string, string> = {
    collection: "active",
    q: "",
    status: "all",
    sort: "deadline",
  };
  for (const [key, value] of Object.entries(values)) {
    if (value === defaults[key]) next.delete(key);
    else next.set(key, value);
  }
  if (
    Object.keys(values).some((key) =>
      ["collection", "q", "status", "sort"].includes(key),
    )
  )
    next.delete("page");
  return next;
}
