/** Present the source notes without import diagnostics; the original snapshot remains unchanged. */
export function historicalReportText(text: string) {
  const statuses: Record<string, string> = { reported: 'Reported held', missed_unspecified: 'Missed', student_no_show: 'Student no-show', rescheduled: 'Rescheduled', scheduled: 'Planned, unconfirmed' };
  return (text || '').replace(/\u000b/g, '\n').split('\n').flatMap(line => {
    if (line.startsWith('Flags: ')) return [];
    if (line.startsWith('Recorded time: ')) return line.replace(/\bNone\b/g, 'not recorded');
    const status = line.match(/^(.*) \| Source status: (\w+)$/);
    if (status) return `${status[1]} | ${statuses[status[2]] ?? status[2]}`;
    if (line.trim().startsWith('{')) {
      try {
        const values = JSON.parse(line);
        return Object.entries(values).map(([key, value]) => `${key.replace(/:\s*$/, '')}: ${value ?? 'Not recorded'}`);
      } catch { /* Non-tabular source text is kept verbatim. */ }
    }
    return line;
  }).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
