import { describe, expect, it } from 'vitest';
import { verifiedStudyAreaUrl } from './UniversityStudyAreas';
const majors = [{id:'cs',type:'undergraduate',name:'Computer Science'}, {id:'masters',type:'graduate',name:'Computer Science'}, {id:'law',type:'undergraduate',name:'Law'}];
const links = [{majorId:'cs',degreeLevel:'undergraduate',url:'https://university.edu/bsc',programmeName:'BSc CS'}, {majorId:'masters',degreeLevel:'graduate',url:'https://university.edu/msc',programmeName:'MSc CS'}];
describe('student-hub verified study areas',()=>{
 it('links the exact undergraduate major and never the same-name graduate offering',()=>{
  expect(verifiedStudyAreaUrl('Computer Science',majors,links)).toBe('https://university.edu/bsc');
  expect(verifiedStudyAreaUrl('Computer Science',majors,links.slice(1))).toBeUndefined();
  expect(verifiedStudyAreaUrl('Law',majors,links)).toBeUndefined();
 });
 it('supports localized names, formatting aliases and multiple IDs for the same field',()=>{
  expect(verifiedStudyAreaUrl(' computer  science ',[{id:'other',type:'undergraduate',name:'Computer Science'},{id:'cs',type:'undergraduate',name:{en:'Computer Science\u200b'}}],links)).toBe('https://university.edu/bsc');
 });
 it.each(['javascript:alert(1)','http://university.edu/bsc','not a URL','https://user:password@university.edu/bsc'])('does not activate an unsafe source: %s',url=>{
  expect(verifiedStudyAreaUrl('Computer Science',majors,[{...links[0],url}])).toBeUndefined();
 });
});
