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
import {
  BarChart,
  LineChart,
  FunnelChart,
} from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import type { EChartsCoreOption } from 'echarts/core';
import ReactEChartsCore from 'echarts-for-react/lib/core';

echarts.use([
  BarChart,
  LineChart,
  FunnelChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  SVGRenderer,
]);

/* ── Editorial palette ──────────────────────────────────────────────────────
   Maroon leads; a small tasteful warm/cool family covers multi-series and
   categorical charts. Kept intentionally short so charts never look like a
   default rainbow. */
export const CC_ACCENT = '#7b1f2f';

export const CC_SERIES = {
  maroon: '#7b1f2f',
  sage: '#3f6b53',
  gold: '#b08328',
  navy: '#3f4a63',
  rose: '#b5566a',
  slate: '#8a7f6e',
};

/* Light → maroon sequential ramp for single-metric categorical charts
   (progress buckets, recency cohorts, funnel stages, AI tools). */
export const CC_MAROON_RAMP = [
  '#e7c4ca',
  '#d295a0',
  '#bd6675',
  '#a13c50',
  '#7b1f2f',
];
export const ccRampAt = (i: number) =>
  CC_MAROON_RAMP[i % CC_MAROON_RAMP.length];

const PALETTE = [
  CC_SERIES.maroon,
  CC_SERIES.sage,
  CC_SERIES.gold,
  CC_SERIES.navy,
  CC_SERIES.rose,
  CC_SERIES.slate,
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
    splitLine: {
      show: true,
      lineStyle: { color: GRID_LINE, type: 'dashed' },
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
}) {
  const { heading, valueSuffix = '', bySeries = true } = opts ?? {};
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
        return `<div class="cc-echart-tip-row">
          ${p.marker ?? ''}
          <span class="cc-echart-tip-name">${label}</span>
          <span class="cc-echart-tip-val">${Number.isFinite(v) ? v.toLocaleString() : '0'}${valueSuffix}</span>
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
