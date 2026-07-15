/* ── Counselor Console — the colour system ───────────────────────────────────
   Program identity + the validated palettes, deliberately SEPARATE from the
   chart module.

   Why its own file: this is product identity (a program's colour, used on
   pills, rows, tabs), not chart configuration. It previously lived in
   `ccEcharts.tsx`, whose top-level `echarts.use([...])` side effect meant any
   page reading a program colour pulled the whole charting library into its
   bundle — including pages that render no chart at all.

   `ccEcharts` re-exports everything here, so existing chart imports keep
   working unchanged. */
/* ── Editorial palette ──────────────────────────────────────────────────────
   Maroon leads; a small tasteful warm/cool family covers multi-series and
   categorical charts. Kept intentionally short so charts never look like a
   default rainbow. */
export const CC_ACCENT = '#7b1f2f';

/**
 * Categorical series palette — VALIDATED, do not hand-edit.
 *
 * Measured against the cream chart surface (#fbfaf6) with CIEDE2000 over
 * Viénot-projected protan/deutan/tritan simulations:
 *   contrast >= 3:1 PASS (4.46–8.19) · chroma floor PASS
 *   lightness band — violet #4a3aa7 sits at L* 32.4, just under the 35 floor.
 *     Kept deliberately: it carries 8.19:1 contrast and moving it collapsed its
 *     separation from green under tritanopia.
 *
 * CVD separation — all TEN pairs are checked, not just adjacent slots: every
 *   program can co-occur in one chart.
 *
 *   THE RULE: **HALF the pairs land in the 8–12 band** — above the >=8 floor,
 *   below the >=12 target. So secondary encoding is mandatory, not optional: a
 *   legend is always present and <=4 series are also direct-labelled. NO two
 *   programs may be told apart by colour alone. Do not remove those affordances.
 *
 *   Deliberately not naming a single "worst pair" here. Three revisions of this
 *   comment each named a different one, because the answer depends on the CVD
 *   model: two independent validators agree exactly on contrast, but disagree on
 *   tritan simulation (one measures gold↔rose 8.7 worst via tritanopia, the
 *   other green↔rose 8.0 via deuteranopia). Both land in the same band and imply
 *   the same rule, so the band and the rule are what's load-bearing — the
 *   headline number is not. Don't re-litigate it; if you change a hue, re-run an
 *   all-pairs check taking the MINIMUM across protan/deutan/tritan (taking any
 *   single simulation, or a mean, is what produced the earlier wrong answers).
 *
 * The previous hand-picked set (maroon/sage/gold/navy/rose/slate) was far worse:
 * rose ↔ slate measured ΔE 2.2 under deuteranopia — two series that were
 * literally the same colour for ~6% of men.
 *
 * Slots are pinned to the five programs so a program keeps its colour across
 * every chart (colour follows the entity, never its rank). If you add or change
 * a hue, re-run the all-pairs check before shipping.
 */
export const CC_SERIES = {
  maroon: '#a62b3f', // slot 1 — Admissions / primary series
  gold: '#8a5f00', // slot 2 — SAT
  green: '#0f7a52', // slot 3 — Research Prep
  violet: '#4a3aa7', // slot 4 — Full Support
  rose: '#b5566a', // slot 5 — Community
};

/** Stable program → series colour map (colour follows the entity). */
export const CC_PROGRAM_COLOR: Record<string, string> = {
  Admissions: CC_SERIES.maroon,
  SAT: CC_SERIES.gold,
  'Research Prep': CC_SERIES.green,
  'Full Support': CC_SERIES.violet,
  Community: CC_SERIES.rose,
};

/** Neutral for anything outside the five pinned programs. There is no 6th
 *  categorical hue — a generated one is indistinguishable from an existing slot
 *  under CVD. Unknown categories fold into this grey. */
export const CC_OTHER = '#8c8371';

/** Colour for a program, falling back to the neutral rather than inventing a hue. */
export const ccProgramColor = (program: string): string =>
  CC_PROGRAM_COLOR[program] ?? CC_OTHER;

/**
 * Light → maroon SEQUENTIAL ramp — for ORDERED bands only (progress buckets,
 * recency cohorts). VALIDATED, do not hand-edit.
 *
 * Checked as an ordinal ramp against the cream surface (#fbfaf6):
 *   lightness monotone PASS · adjacent ΔL >= 0.06 PASS
 *   light-end contrast PASS (#d69ea9 at 2.16:1) · single hue PASS (spread 10°)
 *
 * The previous light end (#e7c4ca) measured 1.53:1 against the cream surface —
 * under the 2:1 floor, i.e. the lowest band of every histogram was very nearly
 * invisible on the page it was drawn on. The ramp was darkened from that end and
 * re-spaced so every step now clears the surface and the gaps stay even.
 *
 * NOT for nominal categories. Colouring unordered categories (AI tool names,
 * mentors, anything without a natural order) darker-where-bigger double-encodes
 * bar length as hue and burns the only free channel on information the bar
 * already shows. Nominal single-measure charts get ONE colour for every bar —
 * use CC_SERIES.maroon.
 */
export const CC_MAROON_RAMP = [
  '#d69ea9',
  '#c47b8a',
  '#b1596c',
  '#97404f',
  '#7b1f2f',
];

/** Clamped ramp lookup. Clamps rather than cycles — cycling an ORDERED scale
 *  wraps the darkest band back to the lightest and misstates the data. */
export const ccRampAt = (i: number) =>
  CC_MAROON_RAMP[Math.min(Math.max(i, 0), CC_MAROON_RAMP.length - 1)];

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};

/**
 * Sample the sequential ramp into exactly `n` ordered steps, interpolating
 * between stops. Use this instead of indexing CC_MAROON_RAMP directly: a band
 * count other than 5 must still read light→dark across its whole range, and the
 * backend chooses how many buckets/cohorts it returns.
 *
 * MEASURED CEILING: n <= 6. Validated as an ordinal ramp against #fbfaf6, the
 * sampled output passes every check (monotone L, adjacent ΔL >= 0.06, light-end
 * contrast, single hue) for n = 3..6. At n >= 7 the adjacent-ΔL check FAILS —
 * the steps land ~0.05 apart, because one hue between L 2.16:1 and the maroon
 * dark end simply has no room for 7 separable bands. That is a property of
 * single-hue ordinal ramps, not a bug to widen the ramp around: stretching the
 * light end back past 2:1 would re-break the contrast floor.
 *
 * Both current callers (the progress histogram and the recency band) print
 * every value directly — on the bar cap and in the key respectively — so at
 * n >= 7 the ramp degrades to decoration while the numbers stay fully readable.
 * If a caller ever needs > 6 ordered bands to be told apart BY COLOUR, the ramp
 * is the wrong instrument; change the form (a table, or fewer/merged bands).
 */
export function ccRampFor(n: number): string[] {
  if (n <= 0) return [];
  if (n === 1) return [CC_MAROON_RAMP[CC_MAROON_RAMP.length - 1]];
  const stops = CC_MAROON_RAMP.map(hexToRgb);
  const last = stops.length - 1;
  return Array.from({ length: n }, (_, i) => {
    const t = (i / (n - 1)) * last;
    const lo = Math.floor(t);
    const hi = Math.min(lo + 1, last);
    const f = t - lo;
    const ch = (k: number) =>
      Math.round(stops[lo][k] + (stops[hi][k] - stops[lo][k]) * f);
    return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`;
  });
}

/** Series hue at a given alpha — for area washes and the unfilled half of a
 *  two-shade "part of whole" bar. Keeps tints tied to the entity's own hue. */
export function ccTint(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Vertical wash under a line: the series hue at ~12% fading to nothing.
 *  A wash, never a saturated block. */
export function ccAreaWash(hex: string) {
  return {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: ccTint(hex, 0.12) },
      { offset: 1, color: ccTint(hex, 0) },
    ],
  };
}

/** The chart surface. Marks are separated by 2px gaps in THIS colour — never by
 *  a stroke drawn around them. */
export const CC_SURFACE = '#fbfaf6';
