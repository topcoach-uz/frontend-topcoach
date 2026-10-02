export type JourneyStageKind = 'explore' | 'try' | 'build' | 'apply' | 'prepare' | 'enroll' | 'plan';

/** Short labels only where the report's own wording supports them. */
export function journeyStage(when: string, actions: string[] = []): { kind: JourneyStageKind; label: string; detail?: string } {
  const match = /\b(explore|try|test|build|apply)\b/i.exec(when);
  if (!match) {
    // Choose decoration from actual phase activities; never invent a stage
    // from its position or replace the model's date/grade/localized title.
    const families = [
      ['enroll', /enroll|visa|accept.*offer|relocat|зачислен|виз/],
      ['apply', /submit.*application|send.*application|application.*deadline|пода[чт].*заяв/],
      ['build', /essay|statement|portfolio|draft|shortlist|university list|college list|эссе|портфолио/],
      ['try', /research|experiment|prototype|small project|исследован|эксперимент/],
      ['prepare', /gpa|grade|academic|subject|competition|olympiad|\bsat\b|ielts|exam|оценк|олимпиад|экзамен/],
      ['explore', /explor|compar|interest|discover|изуч|сравн/],
    ] as const;
    const ranked = families.map(([kind, pattern]) => ({ kind, score: actions.filter(action => pattern.test(action.toLowerCase())).length })).sort((a, b) => b.score - a.score);
    return { kind: ranked[0]?.score ? ranked[0].kind : 'plan', label: when };
  }
  const word = match[1].toLowerCase();
  const kind: JourneyStageKind = word === 'test' ? 'try' : word as JourneyStageKind;
  return { kind, label: { explore: 'Explore', try: 'Try', build: 'Build', apply: 'Apply', prepare: 'Prepare', enroll: 'Enroll', plan: 'Plan' }[kind], detail: when };
}
