export type ProgramVisualKind = 'admissions' | 'research' | 'sat' | 'customized';

/** Authored editorial illustrations, not a student's work, test score or progress. */
export default function ProgramIllustration({ kind }: { kind: ProgramVisualKind }) {
  return <svg className={`mm3-program-art mm3-program-art--${kind}`} viewBox="0 0 320 190" fill="none" aria-hidden="true">
    <path d="M28 159c29-12 73-12 111-3 49-12 115-10 156 4" stroke="#d4c2aa" strokeWidth="2" strokeLinecap="round" />
    {kind === 'admissions' && <>
      <path d="M56 66h77l15 13h113v79H56V66Z" fill="#c3a879" stroke="#927756" strokeWidth="2" />
      <g className="mm3-program-art__paper" transform="rotate(-9 105 96)"><rect x="57" y="35" width="89" height="109" rx="5" fill="#fffdf7" stroke="#a99780" strokeWidth="2" /><rect x="70" y="51" width="60" height="8" fill="#e8c8c8" /><path d="M71 73h53M71 86h44M71 99h50" stroke="#b9a991" strokeWidth="3" /><path d="m75 118 10-9 10 3 13-12" stroke="#7b1f2f" strokeWidth="2.5" /></g>
      <g className="mm3-program-art__paper" transform="rotate(7 195 84)"><rect x="146" y="25" width="92" height="110" rx="5" fill="#fffdf7" stroke="#a99780" strokeWidth="2" /><path d="m162 61 29-16 30 16h-59Z" fill="#ecdfc4" stroke="#7b1f2f" strokeWidth="2" /><path d="M168 66v26m15-26v26m16-26v26m15-26v26m-50 6h55" stroke="#7b1f2f" strokeWidth="3" /><path d="M163 114h57" stroke="#b9a991" strokeWidth="3" /></g>
      <path d="M47 105h225l-14 57H61l-14-57Z" fill="#f0e4ce" stroke="#7b1f2f" strokeWidth="2.5" /><rect x="130" y="124" width="55" height="18" rx="4" fill="#fffdf7" stroke="#b59b6f" strokeWidth="1.5" />
      <path d="M245 54v23m-7-9 7 9 8-9" stroke="#7b1f2f" strokeWidth="2.5" strokeLinecap="round" />
    </>}
    {kind === 'research' && <>
      <g className="mm3-program-art__paper" transform="rotate(-7 130 91)"><rect x="57" y="26" width="147" height="136" rx="5" fill="#fffdf7" stroke="#a99780" strokeWidth="2" /><rect x="75" y="41" width="96" height="7" fill="#d6bb85" /><path d="M75 60h72M75 71h104" stroke="#b9a991" strokeWidth="2.5" /><path d="M81 134v-46m0 46h93" stroke="#aa967c" strokeWidth="2" /><path d="m86 118 20-14 21 6 22-24 22 11" stroke="#7b1f2f" strokeWidth="3" /><circle cx="106" cy="104" r="3" fill="#7b1f2f" /><circle cx="149" cy="86" r="3" fill="#7b1f2f" /></g>
      <g transform="rotate(8 237 62)"><rect x="199" y="30" width="81" height="67" rx="4" fill="#efe3cc" stroke="#b29b77" strokeWidth="2" /><path d="M215 48h43m-43 11h27m-27 12h35" stroke="#b29b77" strokeWidth="2.5" /></g>
      <circle cx="203" cy="110" r="31" fill="#fffdf7" fillOpacity=".8" stroke="#7b1f2f" strokeWidth="5" /><path d="m225 133 29 26" stroke="#7b1f2f" strokeWidth="10" strokeLinecap="round" /><path d="m225 133 6 5" stroke="#c1a581" strokeWidth="10" />
      <path d="m190 113 11-13 15 6" stroke="#7b1f2f" strokeWidth="2.5" /><circle cx="201" cy="100" r="3" fill="#7b1f2f" />
      <path d="M76 19v24a6 6 0 0 0 12 0V21a4 4 0 0 0-8 0v17" stroke="#7b1f2f" strokeWidth="2" strokeLinecap="round" />
    </>}
    {kind === 'sat' && <>
      <g className="mm3-program-art__paper" transform="rotate(-6 125 94)"><rect x="60" y="22" width="133" height="140" rx="5" fill="#fffdf7" stroke="#a99780" strokeWidth="2" /><rect x="77" y="40" width="78" height="8" fill="#e8c8c8" /><path d="M77 65h72m-72 39h61" stroke="#b9a991" strokeWidth="3" />
      <circle cx="82" cy="81" r="5" stroke="#7b1f2f" strokeWidth="2" /><circle cx="104" cy="81" r="5" stroke="#b9a991" strokeWidth="2" /><circle cx="126" cy="81" r="5" stroke="#b9a991" strokeWidth="2" /><circle cx="148" cy="81" r="5" stroke="#b9a991" strokeWidth="2" />
      <circle cx="82" cy="120" r="5" stroke="#b9a991" strokeWidth="2" /><circle cx="104" cy="120" r="5" stroke="#7b1f2f" strokeWidth="2" /><circle cx="126" cy="120" r="5" stroke="#b9a991" strokeWidth="2" /><circle cx="148" cy="120" r="5" stroke="#b9a991" strokeWidth="2" /><path d="M77 143h74" stroke="#b9a991" strokeWidth="2" /></g>
      <g transform="rotate(20 222 109)"><path d="M216 60h13v77l-6 17-7-17V60Z" fill="#c6a66b" stroke="#927756" strokeWidth="1.5" /><path d="M216 137h13l-6 17-7-17Z" fill="#fffdf7" /><path d="m220 148 3 6 3-6" fill="#7b1f2f" /><rect x="216" y="53" width="13" height="13" rx="3" fill="#7b1f2f" /></g>
      <circle cx="237" cy="57" r="25" fill="#f0e4ce" stroke="#7b1f2f" strokeWidth="2.5" /><path d="M237 41v17l11 6m-15-35h9m-5 0v3" stroke="#7b1f2f" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M205 163h60" stroke="#b9a991" strokeWidth="2" />
    </>}
    {kind === 'customized' && <>
      <path d="M94 97c39 24 45 56 91 35 28-14 31-41 67-37" stroke="#7b1f2f" strokeWidth="2" strokeDasharray="4 5" />
      <g className="mm3-program-art__paper" transform="rotate(-7 101 72)"><rect x="42" y="27" width="114" height="89" rx="8" fill="#fffdf7" stroke="#a99780" strokeWidth="2" /><circle cx="74" cy="58" r="14" fill="#eee0c5" /><circle cx="74" cy="54" r="5" stroke="#7b1f2f" strokeWidth="2" /><path d="M65 65a9 9 0 0 1 18 0m-29 18h80m-80 12h61" stroke="#7b1f2f" strokeWidth="2" strokeLinecap="round" /><path d="M101 54h37m-37 10h24" stroke="#b9a991" strokeWidth="2.5" /></g>
      <g className="mm3-program-art__paper" transform="rotate(6 220 90)"><rect x="172" y="59" width="109" height="87" rx="8" fill="#f0e4ce" stroke="#b29b77" strokeWidth="2" /><circle cx="199" cy="86" r="12" fill="#fffdf7" /><circle cx="199" cy="82" r="4" stroke="#7b1f2f" strokeWidth="2" /><path d="M192 95a7 7 0 0 1 14 0m11-13h44m-44 11h30m-55 21h68m-68 12h49" stroke="#7b1f2f" strokeWidth="2" strokeLinecap="round" /></g>
      <circle cx="159" cy="42" r="17" fill="#7b1f2f" /><path d="M151 39h16m-16 6h10" stroke="#fffdf7" strokeWidth="2" strokeLinecap="round" /><path d="m149 50-4 8 12-7" fill="#7b1f2f" />
      <circle cx="139" cy="145" r="10" fill="#fffdf7" stroke="#7b1f2f" strokeWidth="2" /><path d="M139 140v10m-5-5h10" stroke="#7b1f2f" strokeWidth="1.5" />
    </>}
  </svg>;
}
