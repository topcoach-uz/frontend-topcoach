import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import UniversityMajorSection from './index';
import type { MajorsSchema } from 'src/app/api/Api';
vi.mock('src/components/common', () => ({ CustomText: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
const majors = [{id:'bsc',name:'Computer Science',type:'undergraduate'},{id:'msc',name:'Computer Science',type:'graduate'}] as unknown as MajorsSchema[];
describe('verified university programme links',()=>{
 it('renders the official link for each degree independently',()=>{
  const html=renderToStaticMarkup(<UniversityMajorSection majors={majors} verifiedProgramLinks={[{majorId:'bsc',degreeLevel:'undergraduate',url:'https://university.edu/bachelor-cs',programmeName:'BSc'},{majorId:'msc',degreeLevel:'graduate',url:'https://university.edu/master-cs',programmeName:'MSc'}]}/>);
  expect(html).toContain('href="https://university.edu/bachelor-cs"');expect(html).toContain('href="https://university.edu/master-cs"');expect(html).toContain('official undergraduate program');expect(html).toContain('official graduate program');
 });
 it('does not reuse another degree link or render an unsafe URL',()=>{
  const html=renderToStaticMarkup(<UniversityMajorSection majors={majors} verifiedProgramLinks={[{majorId:'bsc',degreeLevel:'graduate',url:'https://wrong.edu',programmeName:'Wrong level'},{majorId:'msc',degreeLevel:'graduate',url:'javascript:alert(1)',programmeName:'Invalid'}]}/>);
  expect(html).not.toContain('href=');expect(html).not.toContain('javascript:');
 });
});
