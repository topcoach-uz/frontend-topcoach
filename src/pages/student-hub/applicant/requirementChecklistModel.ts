export type Requirements = Record<string, any>;
export type RequirementRow = {
  id: string;
  title: string;
  completed: boolean;
  section: string;
  index?: number;
};

export function requirementRows(
  requirements: Requirements = {},
): RequirementRow[] {
  const rows: RequirementRow[] = [];
  for (const [section, label] of [
    ["essays", "Essay"],
    ["recommendations", "Recommendation"],
    ["supplements", "Supplement"],
  ]) {
    const value = requirements[section];
    if (!value) continue;
    for (let i = 0; i < Math.min(50, value.required || 0); i++) {
      rows.push({
        id: `${section}-${i}`,
        section,
        index: i,
        title: value.prompts?.[i] || `${label} ${i + 1}`,
        completed: Array.isArray(value.completedItems)
          ? value.completedItems.includes(i)
          : i <
            (value[section === "recommendations" ? "submitted" : "completed"] ||
              0),
      });
    }
  }
  if (requirements.transcripts)
    rows.push({
      id: "transcripts",
      section: "transcripts",
      title: "Official transcript",
      completed: requirements.transcripts.status === "received",
    });
  (requirements.testScores?.required || []).forEach(
    (title: string, index: number) =>
      rows.push({
        id: `testScores-${index}`,
        section: "testScores",
        index,
        title,
        completed: (requirements.testScores.submitted || []).includes(title),
      }),
  );
  if (requirements.interviews?.required)
    rows.push({
      id: "interviews",
      section: "interviews",
      title: "Interview",
      completed: !!requirements.interviews.completed,
    });
  (requirements.custom?.items || []).forEach((item: any) =>
    rows.push({
      id: item.id,
      section: "custom",
      title: item.title,
      completed: item.completed,
    }),
  );
  return rows;
}

export function toggleRequirement(
  requirements: Requirements,
  row: RequirementRow,
  checked: boolean,
): Requirements {
  const next = structuredClone(requirements);
  const value = next[row.section];
  if (["essays", "recommendations", "supplements"].includes(row.section)) {
    const completed = new Set(
      requirementRows(requirements)
        .filter((r) => r.section === row.section && r.completed)
        .map((r) => r.index!),
    );
    if (checked) completed.add(row.index!);
    else completed.delete(row.index!);
    value.completedItems = [...completed].sort((a, b) => a - b);
    value[row.section === "recommendations" ? "submitted" : "completed"] =
      completed.size;
  } else if (row.section === "transcripts")
    value.status = checked ? "received" : "pending";
  else if (row.section === "interviews")
    value.completed = checked ? new Date().toISOString() : null;
  else if (row.section === "testScores")
    value.submitted = checked
      ? [...new Set([...(value.submitted || []), row.title])]
      : (value.submitted || []).filter((s: string) => s !== row.title);
  else
    value.items = value.items.map((item: any) =>
      item.id === row.id ? { ...item, completed: checked } : item,
    );
  return next;
}

export function setRequirementCount(
  requirements: Requirements,
  section: string,
  required: number,
): Requirements {
  const next = structuredClone(requirements);
  const completedItems = requirementRows(requirements)
    .filter((r) => r.section === section && r.completed && r.index! < required)
    .map((r) => r.index!);
  next[section] = {
    ...next[section],
    required,
    completedItems,
    [section === "recommendations" ? "submitted" : "completed"]:
      completedItems.length,
  };
  return next;
}
