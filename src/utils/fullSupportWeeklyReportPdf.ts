import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'src/lib/dayjs';
import type { WeeklyReportData } from 'src/app/services/fullSupportApi';

function formatDate(isoDate: string): string {
  if (!isoDate) return '—';
  return dayjs(isoDate).format('MMM D, YYYY');
}

function formatDateTime(isoDate: string): string {
  if (!isoDate) return '—';
  return dayjs(isoDate).format('MMM D, YYYY h:mm A');
}

function taskStatus(task: { hasFeedback?: boolean; submissionText?: string }): string {
  if (task.hasFeedback) return 'Reviewed';
  if (task.submissionText) return 'Needs review';
  return 'Pending';
}

export function generateWeeklyReportPdf(data: WeeklyReportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = 20;

  const checkNewPage = (requiredSpace: number = 15) => {
    if (yPos + requiredSpace > pageHeight - 25) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Header
  doc.setFillColor(139, 0, 0);
  doc.rect(0, 0, pageWidth, 44, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Full Support — Weekly Report', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(data.studentName, pageWidth / 2, 26, { align: 'center' });
  doc.text(`Generated: ${dayjs().format('MMM D, YYYY')}`, pageWidth / 2, 34, { align: 'center' });
  yPos = 52;
  doc.setTextColor(0, 0, 0);

  // Session timeline
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Session timeline (this month)', margin, yPos);
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const hoursText = data.allocatedHours > 0
    ? `${data.usedHours}h used / ${data.allocatedHours}h allocated`
    : `${data.usedHours}h used · No sessions scheduled`;
  doc.text(hoursText, margin, yPos);
  yPos += 6;
  if (data.sessions.length === 0) {
    doc.setTextColor(100, 100, 100);
    doc.text('No sessions logged yet.', margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
  } else {
    data.sessions.slice(0, 10).forEach((s) => {
      checkNewPage(14);
      doc.text(`${formatDateTime(s.dateTime)} — ${s.duration}`, margin, yPos);
      yPos += 5;
      if (s.description) {
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(s.description.substring(0, 85) + (s.description.length > 85 ? '…' : ''), margin + 2, yPos);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        yPos += 5;
      }
      yPos += 4;
    });
    if (data.sessions.length > 10) {
      doc.text(`… and ${data.sessions.length - 10} more sessions`, margin, yPos);
      yPos += 8;
    }
    yPos += 4;
  }

  // Curriculum Watchlist
  checkNewPage(25);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Curriculum Watchlist', margin, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (data.curriculumWatchlist.length === 0) {
    doc.setTextColor(100, 100, 100);
    doc.text('No curriculum items yet.', margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
  } else {
    data.curriculumWatchlist.forEach((item) => {
      checkNewPage(10);
      doc.text(`${item.label}: ${item.percent}%${item.target ? ` (${item.target})` : ''}`, margin, yPos);
      yPos += 6;
    });
    yPos += 4;
  }

  // Tasks from mentor
  checkNewPage(30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Tasks from mentor', margin, yPos);
  yPos += 8;
  if (data.tasks.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('No tasks yet.', margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 12;
  } else {
    autoTable(doc, {
      startY: yPos,
      head: [['Task', 'Deadline', 'Status']],
      body: data.tasks.map((t) => [t.task, formatDate(t.deadline), taskStatus(t)]),
      margin: { left: margin },
      theme: 'grid',
      headStyles: { fillColor: [139, 0, 0], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Milestones
  checkNewPage(20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Milestone Tracker', margin, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  if (data.milestones.length === 0) {
    doc.setTextColor(100, 100, 100);
    doc.text('No milestones yet.', margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
  } else {
    data.milestones.forEach((m) => {
      checkNewPage(8);
      doc.text(`${m.label} — ${m.date ? formatDate(m.date) : '—'} — ${m.done ? 'Done' : 'Pending'}`, margin, yPos);
      yPos += 6;
    });
    yPos += 4;
  }

  // Application tracker
  checkNewPage(30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Application tracker', margin, yPos);
  yPos += 8;
  if (data.pipeline.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('No applications yet.', margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
  } else {
    autoTable(doc, {
      startY: yPos,
      head: [['Program', 'Stage', 'Status', 'Financial aid']],
      body: data.pipeline.map((p) => [p.program, p.stage, p.status, p.aid ? 'Considering' : '—']),
      margin: { left: margin },
      theme: 'grid',
      headStyles: { fillColor: [139, 0, 0], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `TopCoach Full Support • Page ${p} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  const filename = `full-support-weekly-report-${data.studentName.replace(/\s+/g, '-')}-${dayjs().format('YYYY-MM-DD')}.pdf`;
  doc.save(filename);
}
