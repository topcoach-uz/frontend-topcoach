export type JourneyStageKind = 'explore' | 'try' | 'build' | 'apply' | 'plan';

/** Short labels only where the report's own wording supports them. */
export function journeyStage(when: string): { kind: JourneyStageKind; label: string; detail?: string } {
  const match = /\b(explore|try|test|build|apply)\b/i.exec(when);
  if (!match) return { kind: 'plan', label: when };
  const word = match[1].toLowerCase();
  const kind: JourneyStageKind = word === 'test' ? 'try' : word as JourneyStageKind;
  return { kind, label: { explore: 'Explore', try: 'Try', build: 'Build', apply: 'Apply', plan: 'Plan' }[kind], detail: when };
}
