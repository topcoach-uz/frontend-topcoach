export function listeningPart(library, part) {
  return library?.parts.find((item) => item.part === part) ?? null;
}
export function listeningKeys(library) {
  if (!library?.parts.length) return null;
  const maximum = Math.max(...library.parts.flatMap((p) => p.questionNumbers));
  const keys = Array.from({ length: maximum }, () => "");
  for (const part of library.parts)
    for (const n of part.questionNumbers)
      keys[n - 1] = part.answerKeys[n] || "";
  return keys;
}
export function completeListeningKeys(library, expectedParts = 4) {
  const keys = listeningKeys(library);
  const numbers = library?.parts.flatMap((p) => p.questionNumbers) ?? [];
  return library?.parts.length === expectedParts &&
    numbers.length === 40 &&
    new Set(numbers).size === 40 &&
    keys?.length === 40 &&
    keys.every(Boolean)
    ? keys
    : null;
}
export function listeningPartForQuestion(library, n) {
  return library?.parts.find((p) => p.questionNumbers.includes(n))?.part ?? 1;
}
export function listeningOptionLetters(group) {
  const roman = [
    "i",
    "ii",
    "iii",
    "iv",
    "v",
    "vi",
    "vii",
    "viii",
    "ix",
    "x",
    "xi",
    "xii",
    "xiii",
    "xiv",
    "xv",
    "xvi",
    "xvii",
    "xviii",
    "xix",
    "xx",
  ];
  const range = group.desc.optionRange || group.desc.sectionRange || [];
  if (roman.includes(range[0]) && roman.includes(range[1]))
    return roman.slice(roman.indexOf(range[0]), roman.indexOf(range[1]) + 1);
  const count = (group.body.list || group.body.options || []).length;
  if (count)
    return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
  const [start, end] = group.desc.optionRange || group.desc.sectionRange || [];
  if (!/^[A-Z]$/.test(start || "") || !/^[A-Z]$/.test(end || "") || end < start)
    return [];
  return Array.from(
    { length: end.charCodeAt(0) - start.charCodeAt(0) + 1 },
    (_, i) => String.fromCharCode(start.charCodeAt(0) + i),
  );
}
export function selectListeningGroup(group, answers, letter) {
  const numbers = Array.from(
    { length: group.end - group.start + 1 },
    (_, i) => group.start + i,
  );
  const current = numbers.map((n) => answers[n]).filter(Boolean);
  const selected = current.includes(letter)
    ? current.filter((v) => v !== letter)
    : [...current, letter];
  if (selected.length > numbers.length) return null;
  selected.sort();
  return Object.fromEntries(numbers.map((n, i) => [n, selected[i] || ""]));
}

// Slot indices belong to one numbered answer (e.g. a price/time range).
export function multiSlotCounts(body) {
  const counts = {};
  function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    if (node.type === "inputs")
      counts[node.content] = Math.max(
        counts[node.content] || 0,
        node.index + 1,
      );
    Object.values(node).forEach(walk);
  }
  walk(body);
  return counts;
}

export function practiceRelease(library) {
  return library?.practiceRelease || library?.release || "pending";
}
