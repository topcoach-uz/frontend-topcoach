import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'src/lib/dayjs';
import {
  THEMATIC_CLUSTER_OPTIONS,
  type YouthLeadersDraft,
} from 'src/pages/events/youth-leaders-application/types';
import type { YouthLeadersSubmission } from 'src/pages/events/youth-leaders-application/submissionsStorage';

function thematicLabel(clusterId: string): string {
  if (!clusterId) return '—';
  const found = THEMATIC_CLUSTER_OPTIONS.find((o) => o.id === clusterId);
  return found?.label ?? '—';
}

function rowsFromDraft(d: YouthLeadersDraft): { section: string; body: [string, string][] }[] {
  const { personal: p, idInfo: id, contact: c, arrival: a } = d;
  return [
    {
      section: 'Personal information',
      body: [
        ['Family name', p.familyName || '—'],
        ['Middle name', p.middleName || '—'],
        ['Given name', p.givenName || '—'],
        ['Email', p.email || '—'],
        ['Phone', p.mobile || '—'],
        ['Date of birth', p.dateOfBirth || '—'],
        ['Nationality', p.nationality || '—'],
        ['Dietary', p.dietary || '—'],
        ['Organization', p.organization || '—'],
        ['Position', p.position || '—'],
        ['ID photo file', p.idPhotoFileName || '—'],
        ['Portrait file', p.portraitPhotoFileName || '—'],
      ],
    },
    {
      section: 'ID information',
      body: [
        ['Passport number', id.passportNumber || '—'],
        ['Passport expiry', id.passportExpiry || '—'],
        ['Passport scan file', id.passportScanFileName || '—'],
        ['Chinese visa needed', id.needsVisa || '—'],
        ['Visa application place', id.visaApplicationPlace || '—'],
        ['Program name', id.programName || '—'],
      ],
    },
    {
      section: 'Thematic cluster',
      body: [['Selection', thematicLabel(d.thematicClusterId)]],
    },
    {
      section: 'Contact',
      body: [
        ['Address', c.address || '—'],
        ['WhatsApp', c.whatsapp || '—'],
        ['X (Twitter)', c.twitter || '—'],
        ['Instagram', c.instagram || '—'],
        ['WeChat', c.wechat || '—'],
        ['Short bio', c.shortBio || '—'],
        ['Resume file', c.resumeFileName || '—'],
        ['Topic to share', c.wydfTopic || '—'],
      ],
    },
    {
      section: 'Arrival & departure',
      body: [
        ['Arrival airport', a.arrivalAirport || '—'],
        ['Arrival date', a.arrivalDate || '—'],
        ['Arrival time', a.arrivalTime || '—'],
        ['Arrival flight', a.arrivalFlight || '—'],
        ['Departure airport', a.departureAirport || '—'],
        ['Departure date', a.departureDate || '—'],
        ['Departure time', a.departureTime || '—'],
        ['Departure flight', a.departureFlight || '—'],
      ],
    },
  ];
}

/** One PDF page per submission (adds pages when multiple). */
export function generateYouthLeadersApplicationsPdf(submissions: YouthLeadersSubmission[], title = 'Youth Leaders applications'): void {
  if (submissions.length === 0) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 16;

  submissions.forEach((sub, index) => {
    if (index > 0) {
      doc.addPage();
      y = 16;
    }

    doc.setFillColor(139, 0, 0);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated ${dayjs().format('MMM D, YYYY h:mm A')}`, margin, 22);
    doc.setTextColor(0, 0, 0);
    y = 34;

    const p = sub.draft.personal;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Application ${sub.id.slice(0, 8)}…`, margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Submitted: ${dayjs(sub.submittedAt).format('MMM D, YYYY h:mm A')}`, margin, y);
    y += 4;
    doc.text(`Status: ${sub.status}`, margin, y);
    y += 4;
    doc.text(`Applicant: ${[p.familyName, p.givenName].filter(Boolean).join(' ') || '—'} · ${p.email || '—'}`, margin, y);
    y += 8;

    if (sub.adminNote) {
      doc.setFont('helvetica', 'bold');
      doc.text('Admin note', margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(sub.adminNote, pageWidth - 2 * margin);
      doc.text(lines, margin, y);
      y += lines.length * 4 + 6;
    }

    for (const { section, body } of rowsFromDraft(sub.draft)) {
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 16;
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(section, margin, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        head: [['Field', 'Value']],
        body,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [71, 85, 105] },
        margin: { left: margin, right: margin },
      });
      const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
      y = (finalY ?? y) + 8;
    }
  });

  doc.save(`youth-leaders-applications-${dayjs().format('YYYY-MM-DD-HHmm')}.pdf`);
}

export function generateYouthLeadersApplicationPdf(sub: YouthLeadersSubmission): void {
  generateYouthLeadersApplicationsPdf([sub], 'Youth Leaders application');
}
