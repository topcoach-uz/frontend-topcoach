import { describe, it, expect } from 'vitest';
import { qualificationOptions, selectedQualification, publishedDegreeForStudyArea } from './degreePlanning';
const legacy = { qualificationLabel: 'A-levels', qualificationValue: 'A*AA', qualificationNote: 'Maths' };
const verified = { label: 'International Baccalaureate', value: '39 points; 766 HL', note: 'HL Maths 7', scope: 'Course offer', sourceTitle: 'Oxford', sourceUrl: 'https://www.ox.ac.uk', verifiedAt: '2026-10-24' };
describe('source-specific qualification requirements', () => {
 it('retains legacy data for other universities', () => { expect(selectedQualification(legacy, 'A-levels')?.value).toBe('A*AA'); expect(selectedQualification(legacy, 'International Baccalaureate')).toBeUndefined(); });
 it('uses the selected structured qualification with its own provenance', () => { const d = { ...legacy, qualificationRequirements: [{ ...verified, label: 'A-levels', value: 'A*AA' }, verified] }; expect(selectedQualification(d, 'International Baccalaureate')).toEqual(verified); expect(qualificationOptions(d).map(x=>x.value)).toEqual(['A-levels','International Baccalaureate','Other qualifications']); });
 it('does not silently reuse a legacy offer for an unverified structured choice', () => { expect(selectedQualification({ ...legacy, qualificationRequirements: [verified] }, 'A-levels')).toBeUndefined(); });
 it('rejects incomplete unverified structured rows and preserves the legacy fallback', () => { expect(selectedQualification({ ...legacy, qualificationRequirements: [{...verified, sourceUrl:''}] }, 'A-levels')?.value).toBe('A*AA'); });
 it('shows guidance without inventing a numeric offer', () => { const d={...legacy, qualificationRequirements:[{...verified,value:'Report IB coursework and exam results',scope:'University-wide first-year guidance'}]}; expect(selectedQualification(d,'International Baccalaureate')?.value).toBe('Report IB coursework and exam results'); expect(selectedQualification(d,'International Baccalaureate')?.scope).toBe('University-wide first-year guidance'); });
});

describe('published study-area upgrades', () => {
 const degree = { id:'published', name:'Mathematics and Philosophy' } as import('src/app/services/undergraduateDegreesApi').UndergraduateDegree;
 it('resolves an existing study-area link to newly published course facts',()=>{expect(publishedDegreeForStudyArea([degree],' mathematics  and philosophy ')?.id).toBe('published');});
 it('does not confuse a related major with a different published course',()=>{expect(publishedDegreeForStudyArea([degree],'Mathematics')).toBeUndefined();});
 it('does not choose between ambiguous duplicate names',()=>{expect(publishedDegreeForStudyArea([degree,{...degree,id:'second'}],degree.name)).toBeUndefined();});
});

it('does not add an empty generic IB choice beside verified IB Diploma guidance', () => {
  const degree = { qualificationLabel: null, qualificationValue: null, qualificationRequirements: [{ label: 'IB Diploma', value: '38 points on the published scale', scope: 'Exact published programme', sourceTitle: 'Official requirements', sourceUrl: 'https://university.edu/requirements', verifiedAt: '2026-10-30T00:00:00Z' }] };
  expect(qualificationOptions(degree).filter(option => /\bib\b|international baccalaureate/i.test(option.label)).map(option => option.label)).toEqual(['IB Diploma']);
});

it('keeps published British and international A-level rules separate without an empty generic duplicate', () => {
  const degree = { qualificationLabel: null, qualificationValue: null, qualificationRequirements: ['British A-levels', 'International A-levels'].map(label => ({ label, value: 'See the published route-specific conditions', scope: 'Certificate-specific recognition', sourceTitle: 'Official requirements', sourceUrl: 'https://university.edu/requirements', verifiedAt: '2026-10-30T00:00:00Z' })) };
  expect(qualificationOptions(degree).filter(option => /a-level/i.test(option.label)).map(option => option.label)).toEqual(['British A-levels', 'International A-levels']);
});
