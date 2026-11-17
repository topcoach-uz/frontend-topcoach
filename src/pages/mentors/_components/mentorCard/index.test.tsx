import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import MentorCard from './index';

vi.mock('src/app/store', () => ({ useTypedSelector: () => ({ colors: {} }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => () => {} }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: () => '' }) }));
vi.mock('src/components/cards', () => ({ CustomCard: ({ children }: any) => <div>{children}</div> }));
vi.mock('src/components/common', () => ({ CustomText: ({ children }: any) => <span>{children}</span> }));
vi.mock('src/utils/countryFlags', () => ({ getUniversityFlag: () => '' }));

const props = { id: 'mentor', name: 'Test Mentor', imgSrc: '', major: 'Law', university: 'University', rating: 0, sessionNumber: 0, level: 'senior' };
describe('public mentor card', () => {
  it('hides the rate while retaining audience and tier', () => {
    const html = renderToStaticMarkup(<MentorCard {...props} mentorshipType="both" showPrice={false} />);
    expect(html).toContain('Master');
    expect(html).toContain('senior');
    expect(html).not.toContain('$25');
    expect(html).not.toContain('/ session');
  });
  it.each(['junior', 'senior', 'expert', 'probono', 'uzcombinator'])('hides %s rates even when saved price visibility is enabled', level => {
    const html = renderToStaticMarkup(<MentorCard {...props} level={level} mentorshipType="master" showPrice email="ahmadullayevarabboy@gmail.com" />);
    expect(html).toContain('Master');
    expect(html).not.toContain('$');
    expect(html).not.toContain('/ session');
    expect(html).not.toContain('Free / Pro-bono');
    expect(html).not.toContain('Contact for pricing');
  });
});
