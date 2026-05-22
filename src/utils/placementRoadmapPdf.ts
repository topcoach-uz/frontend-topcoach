import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'src/lib/dayjs';
import type { MentorsResponseDto } from 'src/app/api/Api';
import type { RoadmapResponse } from 'src/app/services/roadmapApi';
import { pickTopcoachLink } from 'src/pages/placement-test/roadmap/_components/categoryTopcoachLinks';
import { rateLabelForLevel } from 'src/pages/placement-test/roadmap/_components/useRankedMentors';

/**
 * jsPDF's built-in helvetica only ships with WinAnsi encoding, so
 * Unicode glyphs outside CP1252 (notably `→` U+2192) render as garbled
 * sequences. `›` U+203A is in WinAnsi and reads as a clean chevron
 * across PDF viewers, so we use it for every "next step" pointer.
 */
const ARROW = '›';

/**
 * Render the user's personalized admissions roadmap as a downloadable PDF.
 * Modeled on `generateWeeklyReportPdf` so it shares the same Top Coach
 * crimson header treatment and helvetica body font. We deliberately
 * skip rendering external resource URLs as clickable links — the
 * `topcoachResource.path` references are app-internal and meaningless
 * outside the browser session anyway.
 */

const COLORS = {
  brand: [139, 31, 47] as [number, number, number],
  ink: [26, 26, 26] as [number, number, number],
  muted: [122, 113, 99] as [number, number, number],
  hairline: [229, 227, 218] as [number, number, number],
};

const PRIORITY_LABEL: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return dayjs(iso).format('MMM D, YYYY');
  } catch {
    return iso;
  }
}

export interface RoadmapPdfOptions {
  /** Same shortlist the on-page RecommendedMentors section renders.
   * If omitted, the PDF simply skips the mentors page. */
  mentors?: MentorsResponseDto[];
}

export function generatePlacementRoadmapPdf(
  data: RoadmapResponse,
  options: RoadmapPdfOptions = {},
): void {
  const { meta, roadmap } = data;
  const { mentors = [] } = options;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  let y = 18;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 18) {
      doc.addPage();
      y = 18;
    }
  };

  // ── Header band ────────────────────────────────────────────────────
  doc.setFillColor(...COLORS.brand);
  doc.rect(0, 0, pageWidth, 38, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Top Coach University', margin, 15);
  doc.setFontSize(20);
  doc.text('Personalized Admissions Roadmap', margin, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generated ${formatDate(meta.generatedAt)}`, margin, 32);
  doc.setTextColor(...COLORS.ink);
  y = 50;

  // ── Student strip ──────────────────────────────────────────────────
  const cells: { label: string; value: string }[] = [
    { label: 'Student', value: meta.studentName || '—' },
    { label: 'Grade', value: meta.gradeLevel != null ? String(meta.gradeLevel) : '—' },
    { label: 'SAT', value: meta.satScore != null ? String(meta.satScore) : '—' },
    {
      label: 'English',
      value:
        (meta.placementLevel ?? '—') +
        (meta.placementScore != null ? ` · ${meta.placementScore}%` : ''),
    },
    { label: 'Profile', value: meta.strength || '—' },
  ];
  const cellW = (pageWidth - margin * 2) / cells.length;
  doc.setDrawColor(...COLORS.hairline);
  doc.setLineWidth(0.2);
  cells.forEach((c, i) => {
    const x = margin + cellW * i;
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.setFont('helvetica', 'bold');
    doc.text(c.label.toUpperCase(), x, y);
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.ink);
    doc.setFont('helvetica', 'bold');
    doc.text(c.value, x, y + 6);
    if (i < cells.length - 1) {
      doc.line(x + cellW - 2, y - 3, x + cellW - 2, y + 8);
    }
  });
  y += 14;
  doc.setDrawColor(...COLORS.hairline);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Personalized summary ───────────────────────────────────────────
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY', margin, y);
  y += 6;
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.ink);
  doc.setFont('helvetica', 'normal');
  const summaryLines = doc.splitTextToSize(
    roadmap.personalizedSummary || '—',
    pageWidth - margin * 2,
  );
  ensureSpace(summaryLines.length * 5 + 4);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 6;

  // ── Timeline ───────────────────────────────────────────────────────
  if (roadmap.timeline?.length) {
    ensureSpace(14);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.setFont('helvetica', 'bold');
    doc.text('TIMELINE', margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Phase', 'Period', 'Focus']],
      body: roadmap.timeline.map((p) => [p.phase, p.period, p.focus]),
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, textColor: COLORS.ink },
      headStyles: {
        fillColor: COLORS.brand,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: { fillColor: [251, 246, 236] },
      margin: { left: margin, right: margin },
    });
    // jspdf-autotable stamps `lastAutoTable.finalY` after running.
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ── Action plan ────────────────────────────────────────────────────
  if (roadmap.actionItems?.length) {
    ensureSpace(14);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.setFont('helvetica', 'bold');
    doc.text(`ACTION PLAN (${roadmap.actionItems.length} items)`, margin, y);
    y += 6;

    roadmap.actionItems.forEach((item, idx) => {
      const priority = PRIORITY_LABEL[item.priority] ?? item.priority;
      const titleLines = doc.splitTextToSize(
        `${idx + 1}. ${item.title}`,
        pageWidth - margin * 2,
      );
      const descLines = doc.splitTextToSize(
        item.description || '',
        pageWidth - margin * 2,
      );
      const blockHeight = titleLines.length * 5 + descLines.length * 5 + 12;
      ensureSpace(blockHeight);

      doc.setFontSize(11);
      doc.setTextColor(...COLORS.ink);
      doc.setFont('helvetica', 'bold');
      doc.text(titleLines, margin, y);
      y += titleLines.length * 5 + 1;

      doc.setFontSize(8);
      doc.setTextColor(...COLORS.muted);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${priority} priority · ${item.category} · ${item.timeline}`,
        margin,
        y,
      );
      y += 5;

      if (descLines.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.ink);
        doc.text(descLines, margin, y);
        y += descLines.length * 5 + 2;
      }

      // Use the same first-party override the on-page row uses so the
      // PDF promotes our own SAT-prep / Research / Admissions pages
      // rather than whatever path the LLM produced.
      const topcoachLink = pickTopcoachLink(item);
      if (topcoachLink) {
        ensureSpace(6);
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.brand);
        doc.setFont('helvetica', 'bold');
        doc.text(
          `${ARROW} ${topcoachLink.action} (${topcoachLink.section})`,
          margin,
          y,
        );
        y += 5;
      }
      doc.setTextColor(...COLORS.ink);
      doc.setFont('helvetica', 'normal');
      y += 3;
    });
  }

  // ── Recommended mentors ───────────────────────────────────────────
  if (mentors.length > 0) {
    // Always start mentors on a fresh page — it's a self-contained
    // "next step" the student can take, and forcing a page break also
    // avoids awkward mid-mentor splits.
    doc.addPage();
    y = 18;

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.setFont('helvetica', 'bold');
    doc.text('RECOMMENDED MENTORS', margin, y);
    y += 4;

    doc.setFontSize(16);
    doc.setTextColor(...COLORS.ink);
    doc.text('Work 1:1 with a Top Coach mentor', margin, y + 4);
    y += 10;

    const primaryInterest = meta.academicInterests?.[0];
    const lede = primaryInterest
      ? `Hand-picked from our top coaches based on your interest in ${primaryInterest}. Book a 1:1 to fast-track the work above.`
      : 'Hand-picked from our top coaches based on your goals. Book a 1:1 to fast-track the work above.';
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.muted);
    doc.setFont('helvetica', 'normal');
    const ledeLines = doc.splitTextToSize(lede, pageWidth - margin * 2);
    doc.text(ledeLines, margin, y);
    y += ledeLines.length * 5 + 4;

    autoTable(doc, {
      startY: y,
      head: [['Mentor', 'University', 'Major', 'Rate']],
      body: mentors.map((m) => [
        m.profile?.name ?? '—',
        m.mentorProfile?.university ?? '—',
        m.mentorProfile?.major ?? '—',
        rateLabelForLevel(m.mentorProfile?.level),
      ]),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 4,
        textColor: COLORS.ink,
        valign: 'middle',
      },
      headStyles: {
        fillColor: COLORS.brand,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: { fillColor: [251, 246, 236] },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 42 },
        3: { textColor: COLORS.brand, fontStyle: 'bold' },
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.brand);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `${ARROW} Browse the full mentor roster at topcoachuni.com/mentors`,
      margin,
      y,
    );
  }

  // ── Footer (every page) ────────────────────────────────────────────
  // `@types/jspdf@1.3.3` is older than the runtime API (jsPDF v3),
  // which exposes `getNumberOfPages()` on `doc.internal`. Cast to skip
  // the stale type check — matches how `fullSupportWeeklyReportPdf` does it.
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Top Coach University · Personalized Admissions Roadmap · ${formatDate(meta.generatedAt)}`,
      margin,
      pageHeight - 8,
    );
    doc.text(`${i} / ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  const safeName = (meta.studentName || 'student').replace(/[^a-z0-9-_]+/gi, '_');
  const stamp = dayjs(meta.generatedAt).format('YYYY-MM-DD');
  doc.save(`topcoach-roadmap-${safeName}-${stamp}.pdf`);
}
