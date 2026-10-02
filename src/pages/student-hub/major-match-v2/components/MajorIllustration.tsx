/** Decorative subject motifs, not additional assessment evidence. */
export default function MajorIllustration({ name }: { name: string }) {
  const subject = name.toLowerCase();
  const type = /computer|software|data|engineering|technology/.test(subject) ? 'build'
    : /econom|business|financ|account|management/.test(subject) ? 'patterns'
    : /policy|politic|law|social|history/.test(subject) ? 'society' : 'explore';
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
      <path d="M119 120c-20-15-40-20-65-14V43c26-6 45-2 65 13 20-15 39-19 65-13v63c-25-6-45-1-65 14Z" fill="#fffdf8" stroke="currentColor" strokeWidth="2" /><path d="M119 56v64M68 63l34 10M68 78l34 10m35-15 32-10m-32 25 32-10" stroke="currentColor" strokeOpacity=".4" strokeWidth="2" /><circle cx="179" cy="109" r="16" fill="#f0dfc5" stroke="currentColor" /><path d="m179 100 3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6Z" fill="currentColor" />
    </>}
  </svg>;
}
