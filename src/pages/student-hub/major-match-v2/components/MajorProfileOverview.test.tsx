import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import MajorProfileOverview from './MajorProfileOverview';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }) }));

describe('MajorProfileOverview', () => {
  it('keeps the report evidence and all four signal values', () => {
    const html = renderToStaticMarkup(<MajorProfileOverview major={{ name: 'Computer Science', fitScore: 88, why: 'Test practical solutions.', about: 'Algorithms and systems.', careers: ['Software development'], breakdown: { interests: 90, skills: 86, workStyle: 88, goals: 88 } }} />);
    expect(html).toContain('Test practical solutions.');
    expect(html).toContain('Algorithms and systems.');
    expect(html).toContain('Software development');
    expect(html).toContain('width:90%');
    expect(html).toContain('width:86%');
    expect(html.match(/class="mm3-results__signal"/g)).toHaveLength(4);
    expect(html).toContain('This shows fit, not ability.');
  });
  it('does not invent content or scores when optional evidence is absent', () => {
    const html = renderToStaticMarkup(<MajorProfileOverview major={{ name: 'Economics', fitScore: 83, why: '', careers: [] }} />);
    expect(html).toContain('Economics');
    expect(html).not.toContain('mm3-results__profile-signals');
    expect(html).not.toContain('mm3-results__profile-careers');
    expect(html).not.toContain('mm3-results__profile-study');
  });
});
