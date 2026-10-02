import { Activity, Atom, Brain, BriefcaseBusiness, Camera, Compass, Dna, FlaskConical, Globe2, GraduationCap, Languages, Leaf, MessageCircle, Microscope, Music, Palette, Ruler, Scale, Settings, Sigma, Sprout, Stethoscope } from 'lucide-react';
import { majorMotif } from '../majorMotif';

const SUBJECT_ICONS = { neuroscience: Brain, laboratory: Microscope, biomedical: Dna, health: Stethoscope, law: Scale, psychology: MessageCircle, architecture: Ruler, environment: Leaf, agriculture: Sprout, biology: Dna, chemistry: FlaskConical, physics: Atom, math: Sigma, engineering: Settings, business: BriefcaseBusiness, education: GraduationCap, languages: Languages, music: Music, arts: Palette, media: Camera, geography: Globe2, sport: Activity, explore: Compass };

/** Decorative subject motifs, not additional assessment evidence. */
export default function MajorIllustration({ name }: { name: string }) {
  const motif = majorMotif(name);
  const type = motif === 'computing' ? 'build' : motif === 'economics' ? 'patterns' : motif;
  const Icon = SUBJECT_ICONS[motif as keyof typeof SUBJECT_ICONS] ?? Compass;
  return <svg className={`mm3-results__subject-art mm3-results__subject-art--${type}`} viewBox="0 0 240 150" fill="none" aria-hidden="true">
    <path d="M72 28c33-22 99-8 116 28 16 34-9 73-51 78-48 6-101-23-92-60 4-18 13-35 27-46Z" fill="currentColor" opacity=".13" />
    <circle cx="188" cy="31" r="15" fill="#f8c77b" opacity=".85" />
    <circle cx="42" cy="108" r="10" fill="currentColor" opacity=".2" />
    <path d="m202 82 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="currentColor" opacity=".5" />
    <path d="M24 124h192M39 26h22M50 15v22M192 39h18M201 30v18" stroke="currentColor" strokeOpacity=".25" strokeWidth="2" />
    {type === 'build' ? <>
      <rect x="53" y="35" width="130" height="88" rx="9" fill="#fffdf8" stroke="currentColor" strokeWidth="2" /><path d="M53 54h130" stroke="currentColor" strokeOpacity=".3" /><circle cx="64" cy="45" r="2" fill="currentColor" /><circle cx="72" cy="45" r="2" fill="currentColor" /><path d="m96 74-15 13 15 13m44-26 15 13-15 13m-11-32-14 45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><rect x="165" y="95" width="35" height="35" rx="8" fill="#e6ecdf" stroke="currentColor" /><path d="m174 112 6 6 11-12" stroke="currentColor" strokeWidth="2" />
    </> : type === 'patterns' ? <>
      <rect x="56" y="34" width="127" height="89" rx="8" fill="#fffdf8" stroke="currentColor" strokeWidth="2" /><path d="M73 106V88h21v18m14 0V72h21v34m14 0V57h21v49" fill="currentColor" opacity=".18" /><path d="m70 76 36-18 28 3 28-25m-14 0h14v14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="174" cy="117" r="16" fill="#f0dfc5" stroke="currentColor" /><path d="M174 107v20m5-15h-7a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-7" stroke="currentColor" strokeWidth="1.5" />
    </> : type === 'society' ? <>
      <path d="m56 59 63-30 64 30H56Z" fill="#fffdf8" stroke="currentColor" strokeWidth="2" /><path d="M65 115h109m-101-8V69m30 38V69m30 38V69m30 38V69" stroke="currentColor" strokeWidth="8" /><path d="M57 124h127" stroke="currentColor" strokeWidth="3" /><circle cx="180" cy="96" r="19" fill="#e6ecdf" stroke="currentColor" /><path d="M173 96h14m-7-7v14" stroke="currentColor" strokeWidth="2" />
    </> : <>
      <g transform="rotate(-5 119 78)"><rect x="65" y="26" width="110" height="100" rx="12" fill="#fffdf8" stroke="currentColor" strokeWidth="1.5" /><path d="M81 40h18M156 112h-18" stroke="currentColor" strokeOpacity=".25" strokeWidth="2" /><Icon x={84} y={42} width={72} height={68} strokeWidth={1.4} /></g><circle cx="178" cy="109" r="16" fill="#f0dfc5" stroke="currentColor" /><path d="m171 109 5 5 9-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>}
  </svg>;
}
