import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Mm3University } from 'src/app/services/student-hub/majorMatchApi';
import UniversityDetailContent from './UniversityDetailContent';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }) }));
const university: Mm3University = { id: 'sample', name: 'Sample university', country: null, matchedMajor: 'Computing', tier: 'Reach', admissionOdds: null, whyFit: 'Matches practical interests.', requirements: [{label: 'English', value: 'Sample requirement'}], scholarships: [{ text: 'Merit award', amount: '5,000 USD' }], tuition: '32,000 USD', tuitionUnreliable: false, roadmap: [{when: 'Prepare', actions: ['Gather documents.']}] };
describe('UniversityDetailContent', () => {
  it('preserves evidence without subtracting potential aid from tuition', () => {
    const html = renderToStaticMarkup(<UniversityDetailContent university={university} />);
    for (const value of ['Matches practical interests.', 'Sample requirement', 'Merit award', '5,000 USD', '32,000 USD', 'Gather documents.', 'Not guaranteed.']) expect(html).toContain(value);
    expect(html).not.toContain('27,000');
    expect(html).toContain('not a checklist of what you have completed');
  });
  it('suppresses unreliable fees and does not invent optional sections', () => {
    const html = renderToStaticMarkup(<UniversityDetailContent university={{...university, tuitionUnreliable: true, scholarships: [], requirements: [], roadmap: []}} />);
    expect(html).not.toContain('32,000 USD');
    expect(html).toContain('figure under review');
    expect(html).toContain('No scholarship details');
    expect(html).not.toContain('Professors &amp; labs');
    expect(html).not.toContain('Where graduates get hired');
  });
});
