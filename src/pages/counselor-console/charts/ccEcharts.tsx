/* ── Counselor Console — the single ECharts configuration point ──────────────
   Every chart in the console renders through <CcChart>. The premium, editorial
   feel comes entirely from this file: one registered theme ('cc') that matches
   the console's cream/maroon magazine palette, tight typography, faint
   gridlines and a clean cream-on-ink tooltip. Individual pages only supply data
   + which series to draw — never colors, fonts, grid or tooltip styling.

   Tree-shaken: we register ONLY the chart types and components the console
   uses, and render with the SVGRenderer for crisp, editorial output. */
import { useMemo } from 'react';
import * as echarts from 'echarts/core';
/* Only the chart types the console actually draws. ECharts tree-shakes by
   registration, so an unused type here is dead weight in every bundle that
   touches the console — add a type only when a chart genuinely needs it, and
   remove it when the last caller goes.
     Bar  — magnitude, ordered time, histograms, stacked part-to-whole bands
     Line — trend over time (the Overview small multiples)
     Pie  — part-to-whole share at a glance, drawn as a donut (Programs mix).
            Registered here rather than locally so the 'cc' theme applies; the
            SAT gauge stays local because it is the only gauge in the app. */
// Registration is explicit and tree-shaken: a type not listed here simply
// will not render. Only Bar and Line were registered for a long time, which is
// the sole reason every panel on Analytics looked the same. Add a type here
// when a panel genuinely needs it, not for decoration.
import {
  BarChart,
  LineChart,
  PieChart,
} from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  AxisPointerComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import type { EChartsCoreOption } from 'echarts/core';
import ReactEChartsCore from 'echarts-for-react/lib/core';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  /* Needed to LINK one crosshair across the stacked small-multiple panels on
     Overview, so a single hover reads every measure at the same date. That
     linked read is the whole reason small multiples beat a dual axis here. */
  AxisPointerComponent,
  SVGRenderer,
]);

/* ── Colour system ──────────────────────────────────────────────────────────
   Program identity + the validated palettes now live in `../colors.ts` so that
   pages needing only a program colour don't pull echarts in via this module's
   top-level `echarts.use()` side effect. Re-exported here so every existing
   chart import keeps working unchanged. */
export {
  CC_ACCENT,
  CC_SERIES,
  CC_PROGRAM_COLOR,
  CC_OTHER,
  ccProgramColor,
  CC_MAROON_RAMP,
  ccRampAt,
  ccRampFor,
  ccTint,
  ccAreaWash,
  CC_SURFACE,
} from '../colors';
import {
  CC_SERIES,
  CC_MAROON_RAMP,
  ccTint,
  CC_SURFACE,
} from '../colors';


const PALETTE = [
  CC_SERIES.maroon,
  CC_SERIES.gold,
  CC_SERIES.green,
  CC_SERIES.violet,
  CC_SERIES.rose,
];

const INK = '#1c1a17';
const AXIS_LABEL = '#9a8f7d';
const GRID_LINE = 'rgba(28, 25, 23, 0.08)';
const SERIF =
  "'Iowan Old Style', 'Charter', 'Georgia', 'Times New Roman', serif";
const SANS =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

/* ── The one shared theme ── */
echarts.registerTheme('cc', {
  color: PALETTE,
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: SANS,
    color: AXIS_LABEL,
  },
  title: {
    textStyle: {
      fontFamily: SERIF,
      fontWeight: 500,
      color: INK,
    },
    subtextStyle: { color: AXIS_LABEL },
  },
  line: {
    symbol: 'none',
    smooth: true,
    lineStyle: { width: 2 },
  },
  /* Donut defaults. Segments are separated by a 2px ring in the SURFACE colour,
     never by a stroke drawn around the mark. Labels wear TEXT tokens: the slice
     beside them carries identity, so a label is readable whatever the hue does
     under colour-vision deficiency. */
  pie: {
    itemStyle: {
      borderColor: CC_SURFACE,
      borderWidth: 2,
    },
    label: {
      color: INK,
      fontFamily: SANS,
      fontSize: 11.5,
    },
    labelLine: {
      lineStyle: { color: 'rgba(28, 25, 23, 0.22)' },
      smooth: true,
    },
  },
  categoryAxis: {
    axisLine: { show: true, lineStyle: { color: GRID_LINE } },
    axisTick: { show: false },
    axisLabel: { color: AXIS_LABEL, fontSize: 11, fontFamily: SANS },
    splitLine: { show: false, lineStyle: { color: GRID_LINE } },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: AXIS_LABEL, fontSize: 11, fontFamily: SANS },
    /* Solid hairline, one shade off the surface. Never dashed: dashing adds
       noise and reads as "projection" or "threshold" when it is just a grid. */
    splitLine: {
      show: true,
      lineStyle: { color: GRID_LINE, type: 'solid' },
    },
  },
  legend: {
    textStyle: { color: '#5b5347', fontSize: 12, fontFamily: SANS },
    icon: 'roundRect',
    itemWidth: 10,
    itemHeight: 10,
  },
  tooltip: {
    backgroundColor: INK,
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    padding: [8, 11],
    extraCssText:
      'border-radius:10px;box-shadow:0 8px 24px rgba(28,25,23,0.22);',
    textStyle: { color: '#efe9df', fontSize: 12.5, fontFamily: SANS },
    axisPointer: {
      lineStyle: { color: 'rgba(123,31,47,0.22)', width: 1 },
      crossStyle: { color: 'rgba(123,31,47,0.22)' },
      shadowStyle: { color: 'rgba(123,31,47,0.06)' },
    },
  },
});

/* ── Shared tooltip formatter ────────────────────────────────────────────────
   Cream-on-ink chip: uppercase kicker heading + a colored dot per series with
   tabular-aligned values. Optional per-value suffix (e.g. " students"). */
type TooltipParam = {
  axisValueLabel?: string;
  name?: string;
  seriesName?: string;
  marker?: string;
  value?: number | number[] | Record<string, unknown>;
  data?: unknown;
  color?: string;
};

export function ccTooltipFormatter(opts?: {
  heading?: (raw: string) => string;
  valueSuffix?: string;
  /** Use series name as the row label instead of the category name. */
  bySeries?: boolean;
  /** Per-series suffix override, keyed by series name. Lets one axis-triggered
   *  tooltip read measures with different units (e.g. a small-multiples panel
   *  set where one panel is a percentage and the others are counts) without
   *  falsely implying they share a scale. */
  suffixBySeries?: Record<string, string>;
}) {
  const {
    heading,
    valueSuffix = '',
    bySeries = true,
    suffixBySeries,
  } = opts ?? {};
  return (params: TooltipParam | TooltipParam[]) => {
    const list = Array.isArray(params) ? params : [params];
    if (list.length === 0) return '';
    const rawHead = list[0].axisValueLabel ?? list[0].name ?? '';
    const head = heading ? heading(String(rawHead)) : String(rawHead);
    const rows = list
      .map((p) => {
        const v = Array.isArray(p.value)
          ? Number(p.value[p.value.length - 1])
          : typeof p.value === 'number'
            ? p.value
            : Number((p.data as { value?: number })?.value ?? 0);
        const label = bySeries ? (p.seriesName ?? '') : String(p.name ?? '');
        const suffix = suffixBySeries?.[p.seriesName ?? ''] ?? valueSuffix;
        return `<div class="cc-echart-tip-row">
          ${p.marker ?? ''}
          <span class="cc-echart-tip-name">${label}</span>
          <span class="cc-echart-tip-val">${Number.isFinite(v) ? v.toLocaleString() : '0'}${suffix}</span>
        </div>`;
      })
      .join('');
    return `<div class="cc-echart-tip">
      ${head ? `<div class="cc-echart-tip-head">${head}</div>` : ''}
      <div class="cc-echart-tip-rows">${rows}</div>
    </div>`;
  };
}

/* ── The wrapper every chart uses ── */
export function CcChart({
  option,
  style,
  height = 288,
  className,
}: {
  option: EChartsCoreOption;
  style?: React.CSSProperties;
  height?: number | string;
  className?: string;
}) {
  const mergedStyle = useMemo<React.CSSProperties>(
    () => ({ width: '100%', height, ...style }),
    [height, style],
  );
  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      theme="cc"
      notMerge
      lazyUpdate
      className={className}
      style={mergedStyle}
      opts={{ renderer: 'svg' }}
    />
  );
}

export type { EChartsCoreOption };
