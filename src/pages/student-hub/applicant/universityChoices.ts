import type { UniversitiesSchema } from "src/app/api/Api";
import reviewedUniversityIds from "src/app/services/universities/reviewedUniversityIds.json";
import { getTranslation } from "src/lib/i18n/translationUtils";

const reviewed = new Set(reviewedUniversityIds);

// Keep distinct catalogue IDs selectable, including previously saved selections.
export function buildUniversityChoices(rows: UniversitiesSchema[]) {
  const names = rows.map(row => getTranslation(row.name).trim().replace(/\s+/g, " "));
  const counts = new Map<string, number>();
  names.forEach(name => counts.set(name.toLocaleLowerCase(), (counts.get(name.toLocaleLowerCase()) ?? 0) + 1));
  const labels = rows.map((row, index) => {
    const name = names[index];
    if (counts.get(name.toLocaleLowerCase()) === 1) return name;
    const location = [getTranslation(row.location?.region), getTranslation(row.location?.country)]
      .map(value => value.trim()).filter(Boolean).join(", ");
    return [name, location, reviewed.has(row.id) ? "Reviewed profile" : "Catalogue profile"].filter(Boolean).join(" · ");
  });
  return rows.map((row, index) => ({
    value: row.id,
    label: labels.filter(label => label === labels[index]).length > 1
      ? `${labels[index]} ${labels.slice(0, index + 1).filter(label => label === labels[index]).length}`
      : labels[index],
  }));
}
