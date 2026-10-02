import type { JourneyStageKind } from '../journeyStage';

/** Decorative editorial collages; none of the sketches represent user data. */
export default function JourneyStageIllustration({ kind }: { kind: JourneyStageKind }) {
  return <svg className="mm3-results__stage-scene" viewBox="0 0 240 160" fill="none" aria-hidden="true">
    {kind === 'explore' ? <>
      <path d="m35 138 30-18 133 12-23 19-140-13Z" fill="#dfd1bc" opacity=".5" />
      <g className="mm3-results__collage-paper">
        <path d="m32 72 64-12 28 8 24-12 51 14-11 66-58-10-29 8-65-8-4-54Z" fill="#fffdf7" stroke="#b9aa94" strokeWidth="1.3" />
        <path d="m124 68 6 58m-34-66 5 74" stroke="#d5c8b5" /><path d="m45 87 37-6m-35 17 23-4m-22 16 35-5m70-19 28 4m-29 9 22 3" stroke="#c9bba6" strokeWidth="1.6" />
      </g>
      <path d="M119 111c-5-24-36-36-41-68m41 68c5-35 24-43 31-72m-31 72c36-7 60-16 80-48" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="3 5" />
      <g transform="rotate(-11 61 38)" className="mm3-results__collage-paper"><rect x="32" y="17" width="51" height="41" rx="3" fill="#efe4d0" stroke="#b9aa94" /><path d="m43 45 8-11 8 5 11-13" stroke="currentColor" strokeWidth="2" /><path d="M43 48h28" stroke="#b29765" /></g>
      <g transform="rotate(7 127 28)" className="mm3-results__collage-paper"><rect x="105" y="9" width="47" height="40" rx="3" fill="#f5e7e6" stroke="#b9aa94" /><path d="m123 21-8 7 8 7m10-14 8 7-8 7" stroke="currentColor" strokeWidth="1.8" /></g>
      <g transform="rotate(13 192 48)" className="mm3-results__collage-paper"><rect x="174" y="29" width="43" height="43" rx="3" fill="#fffdf7" stroke="#b9aa94" /><path d="M195 59V42m0 11c-11 1-15-6-11-13 9 0 13 5 11 13Zm0-4c8 1 13-4 10-11-8 0-12 4-10 11Z" stroke="#b29765" strokeWidth="1.6" /></g>
      <circle cx="119" cy="111" r="8" fill="#f5e7e6" stroke="currentColor" strokeWidth="1.5" /><circle cx="119" cy="111" r="2.5" fill="currentColor" />
    </> : kind === 'try' ? <>
      <path d="m25 132 175-6 20 16-172 10-23-20Z" fill="#dfd1bc" opacity=".5" />
      <g transform="rotate(-12 182 48)" className="mm3-results__collage-paper"><path d="M158 15h55v62l-7-2-6 3-6-3-7 3-7-3-7 3-7-3-8 2V15Z" fill="#fffdf7" stroke="#b9aa94" /><path d="M169 29h31m-31 8h20m-19 12 6-5 12 8 11-8" stroke="#b9aa94" strokeWidth="1.7" /><rect x="180" y="10" width="21" height="9" fill="#d9c6a280" /></g>
      <g className="mm3-results__collage-paper"><rect x="43" y="48" width="116" height="77" rx="6" fill="#f1e8db" stroke="currentColor" strokeWidth="1.8" /><rect x="51" y="56" width="100" height="59" rx="2" fill="#fffdf7" /><path d="M30 125h145l-13 12H41l-11-12Z" fill="#d8cbb8" stroke="currentColor" strokeWidth="1.5" /><path d="M85 125h32l-3 4H88l-3-4Z" fill="#fffdf7" /></g>
      <rect x="62" y="66" width="23" height="36" rx="2" fill="#efe4d0" /><rect x="95" y="68" width="44" height="13" rx="2" fill="#f5e7e6" /><path d="M95 90h30m-30 9h20" stroke="#b9aa94" strokeWidth="2" /><path d="m77 76 18-2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" />
      <path d="m178 99 20-9 20 10-20 12-20-13Z" fill="#efe4d0" stroke="#b29765" /><path d="M178 99v21l20 13v-21m20-12v20l-20 13" fill="#f5e7e6" stroke="#b29765" /><path d="m178 99 20 13 20-12" stroke="#b29765" />
      <g transform="rotate(28 31 81)"><path d="M28 53h6v43l-3 10-3-10V53Z" fill="#b29765" /><path d="M28 53h6v8h-6V53Z" fill="currentColor" /><path d="m29 100 2 6 2-6" fill="currentColor" /></g>
    </> : kind === 'build' ? <>
      <path d="m28 137 159-18 31 19-154 14-36-15Z" fill="#dfd1bc" opacity=".5" />
      <path d="m39 40 111-16 40 111-115 14-36-109Z" fill="#d7c6a5" />
      <g transform="rotate(7 160 87)" className="mm3-results__collage-paper"><path d="M113 34h81v112l-9-2-8 2-7-2-8 2-8-2-8 2-8-2-9 2-7-2-9 2V34Z" fill="#fffdf7" stroke="#b9aa94" /><path d="M125 48h47m-47 10h36" stroke="#b9aa94" strokeWidth="2" /><path d="M127 80v30h12V90h12v20h12V74h12v36" fill="#d7c6a5" /><path d="M125 123h47m-47 9h30" stroke="#c9bba6" strokeWidth="1.7" /></g>
      <g transform="rotate(-9 83 72)" className="mm3-results__collage-paper"><rect x="34" y="31" width="91" height="89" fill="#fffdf7" stroke="#b9aa94" /><rect x="42" y="39" width="75" height="54" fill="#f0e7db" /><path d="m46 84 23-28 17 17 14-10 14 21" fill="#b29765" opacity=".55" /><circle cx="101" cy="51" r="6" fill="#d1b782" /><path d="M47 106h51" stroke="currentColor" strokeWidth="1.6" /></g>
      <g transform="rotate(-4 67 31)"><path d="M61 41V21a6 6 0 0 1 12 0v22a4 4 0 0 1-8 0V25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></g>
      <path d="m134 24 28 4-2 11-29-4 3-11Z" fill="#d9c6a280" />
    </> : kind === 'apply' ? <>
      <path d="M97 134h125l-12 9H83l14-9Z" fill="#dfd1bc" opacity=".5" />
      <g className="mm3-results__collage-paper"><path d="M102 47h105v89H102V47Z" fill="#eee3d0" stroke="#b9aa94" /><path d="m96 48 60-24 57 24H96Z" fill="#fffdf7" stroke="#b9aa94" strokeWidth="1.5" /><path d="M111 61h15v20h-15V61Zm73 0h15v20h-15V61Z" fill="#fffdf7" stroke="#b29765" /><path d="M138 134V94a18 18 0 0 1 36 0v40" fill="currentColor" /><path d="M143 134V95a13 13 0 0 1 26 0v39" stroke="#d7c6a5" /><path d="M156 81v53" stroke="#d7c6a5" /><path d="M134 138h44m-49 5h54" stroke="#b9aa94" strokeWidth="2" /></g>
      <g transform="rotate(-9 58 88)" className="mm3-results__collage-paper"><path d="M22 32h74v105l-9-2-9 2-9-2-9 2-9-2-9 2-9-2-11 2V32Z" fill="#fffdf7" stroke="#b9aa94" /><rect x="35" y="47" width="46" height="6" fill="#f5e7e6" /><path d="M35 64h40m-40 10h32m-32 10h40m-40 10h23" stroke="#b9aa94" strokeWidth="1.6" /><path d="m39 112 6-8 3 8 6-5 6 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><rect x="48" y="27" width="27" height="9" fill="#d9c6a280" /></g>
      <path d="M82 119c27 3 30-13 50-14m-6-4 7 4-6 4" stroke="#b29765" strokeWidth="1.7" strokeLinecap="round" strokeDasharray="3 4" />
    </> : kind === 'prepare' ? <>
      <rect x="44" y="87" width="145" height="24" rx="4" fill="#efe4d0" stroke="#b9aa94" /><rect x="56" y="61" width="120" height="26" rx="4" fill="#fffdf7" stroke="currentColor" strokeWidth="1.5" /><path d="M67 68h79m-79 8h55M57 99h116" stroke="#b9aa94" strokeWidth="2" /><path d="m69 28 52-17 52 17-52 18-52-18Z" fill="#f5e7e6" stroke="currentColor" strokeWidth="1.5" /><path d="M87 35v16c17 12 51 12 68 0V35m18-7v29" stroke="currentColor" strokeWidth="1.5" /><circle cx="181" cy="107" r="20" fill="#fffdf7" stroke="#b29765" /><path d="m181 95 4 8 9 1-7 7 2 9-8-4-8 4 2-9-7-7 9-1 4-8Z" fill="#d7c6a5" /><path d="M43 124h155" stroke="#b9aa94" strokeWidth="2" />
    </> : kind === 'enroll' ? <>
      <g transform="rotate(-8 88 80)"><rect x="44" y="25" width="86" height="113" rx="6" fill="#f5e7e6" stroke="currentColor" strokeWidth="1.5" /><circle cx="87" cy="74" r="24" stroke="currentColor" strokeWidth="1.5" /><path d="M63 74h48m-24-24c-18 16-18 32 0 48 18-16 18-32 0-48ZM67 62h40m-40 24h40M64 116h46" stroke="currentColor" strokeWidth="1.3" /></g><g transform="rotate(8 167 86)"><rect x="121" y="63" width="96" height="49" rx="5" fill="#fffdf7" stroke="#b9aa94" /><path d="M146 64v46" stroke="#b9aa94" strokeDasharray="3 4" /><path d="m160 87 33-10-10 18-5-10-18 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M158 103h35" stroke="#b29765" /></g>
    </> : <>
      <g className="mm3-results__collage-paper"><rect x="65" y="26" width="105" height="111" rx="5" fill="#fffdf7" stroke="#b9aa94" /><path d="M83 20v15m67-15v15M66 49h103" stroke="currentColor" strokeWidth="2" /><path d="M82 68h21m13 0h32M82 88h21m13 0h32M82 108h21" stroke="#b29765" strokeWidth="2" /></g>
    </>}
  </svg>;
}
