import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { majorMotif } from './majorMotif';
import MajorIllustration from './components/MajorIllustration';

describe('major subject motifs', () => {
  it.each([
    ['Biomedical Sciences', 'biomedical'], ['Bioengineering', 'biomedical'],
    ['Medical Laboratory Science', 'laboratory'], ['Health Sciences', 'health'],
    ['Neuroscience', 'neuroscience'], ['Law', 'law'], ['Criminal Justice', 'law'],
    ['Psychology', 'psychology'], ['Architecture', 'architecture'],
    ['Environmental Science', 'environment'], ['Agricultural Science', 'agriculture'],
    ['Biology', 'biology'], ['Chemical Engineering', 'chemistry'],
    ['Physics', 'physics'], ['Mathematics', 'math'], ['Statistics', 'math'],
    ['Computer Science', 'computing'], ['Data Analytics', 'computing'], ['Information Systems', 'computing'], ['Mechanical Engineering', 'engineering'],
    ['Economics', 'economics'], ['Business Administration', 'business'],
    ['Education', 'education'], ['Linguistics', 'languages'], ['Literature', 'languages'],
    ['Music', 'music'], ['Fine Arts', 'arts'], ['Journalism', 'media'],
    ['Geography', 'geography'], ['Public Policy', 'society'], ['Sports Science', 'sport'],
    ['Право', 'law'], ['Нейробиология', 'neuroscience'], ['Unknown discipline', 'explore'],
  ])('maps %s to %s', (name, expected) => expect(majorMotif(name)).toBe(expected));

  it('renders different motifs for the four real health-related matches', () => {
    const names = ['Biomedical Sciences', 'Medical Laboratory Science', 'Health Sciences', 'Neuroscience'];
    const rendered = names.map(name => renderToStaticMarkup(<MajorIllustration name={name} />));
    expect(new Set(rendered).size).toBe(4);
    expect(rendered[0]).toContain('lucide-dna');
    expect(rendered[1]).toContain('lucide-microscope');
    expect(rendered[2]).toContain('lucide-stethoscope');
    expect(rendered[3]).toContain('lucide-brain');
  });
  it('uses justice scales for law rather than the generic social-sciences building', () => {
    const html = renderToStaticMarkup(<MajorIllustration name="Law" />);
    expect(html).toContain('lucide-scale');
    expect(html).toContain('aria-hidden="true"');
  });
});
