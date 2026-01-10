import React from 'react';
import { Button, message } from 'antd';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import FontAwesomeIcon from '../../../../components/common/icons/FontAwesomeIcon';
import type {
  PsychometricAssessment,
  RecommendationsResponse,
} from '../../../../app/services/student-hub/psychometricApi';

interface PdfExportProps {
  assessment: PsychometricAssessment;
  recommendations: RecommendationsResponse;
  studentName?: string;
}

// RIASEC dimension names
const RIASEC_NAMES: Record<string, string> = {
  realistic: 'Realistic',
  investigative: 'Investigative',
  artistic: 'Artistic',
  social: 'Social',
  enterprising: 'Enterprising',
  conventional: 'Conventional',
};

// Big Five trait names
const BIG_FIVE_NAMES: Record<string, string> = {
  openness: 'Openness',
  conscientiousness: 'Conscientiousness',
  extraversion: 'Extraversion',
  agreeableness: 'Agreeableness',
  neuroticism: 'Emotional Stability',
};

// Values names
const VALUES_NAMES: Record<string, string> = {
  achievement: 'Achievement',
  creativity: 'Creativity',
  helpingOthers: 'Helping Others',
  independence: 'Independence',
  security: 'Security',
  prestige: 'Prestige',
  workLifeBalance: 'Work-Life Balance',
  intellectualStimulation: 'Learning',
};

export const PdfExport: React.FC<PdfExportProps> = ({
  assessment,
  recommendations,
  studentName = 'Student',
}) => {
  const generatePdf = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      // Header
      doc.setFillColor(139, 0, 0); // #8b0000
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Psychometric Assessment Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated for: ${studentName}`, pageWidth / 2, 32, { align: 'center' });
      
      yPos = 50;
      doc.setTextColor(0, 0, 0);

      // Date
      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPos);
      yPos += 15;

      // RIASEC Code Section
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Your RIASEC Code', margin, yPos);
      yPos += 8;

      doc.setFontSize(28);
      doc.setTextColor(139, 0, 0);
      doc.text(assessment.riasecCode, margin, yPos);
      yPos += 15;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // RIASEC Scores Table
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Interest Profile (RIASEC)', margin, yPos);
      yPos += 8;

      const riasecData = Object.entries(assessment.riasecScores)
        .sort((a, b) => b[1] - a[1])
        .map(([key, value]) => [RIASEC_NAMES[key], `${value.toFixed(0)}%`]);

      autoTable(doc, {
        startY: yPos,
        head: [['Dimension', 'Score']],
        body: riasecData,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [139, 0, 0] },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Big Five Scores
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Personality Profile (Big Five)', margin, yPos);
      yPos += 8;

      const bigFiveData = Object.entries(assessment.bigFiveScores).map(([key, value]) => {
        const displayValue = key === 'neuroticism' ? 100 - value : value;
        return [BIG_FIVE_NAMES[key], `${displayValue.toFixed(0)}%`];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Trait', 'Score']],
        body: bigFiveData,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [99, 102, 241] },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Values Scores
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Values & Motivations', margin, yPos);
      yPos += 8;

      const valuesData = Object.entries(assessment.valuesScores)
        .filter(([_, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([key, value]) => [VALUES_NAMES[key] || key, `${value.toFixed(0)}%`]);

      autoTable(doc, {
        startY: yPos,
        head: [['Value', 'Score']],
        body: valuesData,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [236, 72, 153] },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });

      // New page for recommendations
      doc.addPage();
      yPos = 20;

      // Recommendations Header
      doc.setFillColor(139, 0, 0);
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Major Recommendations', pageWidth / 2, 18, { align: 'center' });
      
      yPos = 40;
      doc.setTextColor(0, 0, 0);

      // Top Recommendations
      const topRecs = recommendations.recommendations.slice(0, 5);
      
      topRecs.forEach((rec, index) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        // Major name and fit score
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 0, 0);
        doc.text(`${index + 1}. ${rec.majorName}`, margin, yPos);
        
        doc.setTextColor(16, 185, 129); // Green
        doc.text(`${rec.fitScore.toFixed(0)}% Match`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 8;

        // Why it fits
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        const whyFitsLines = doc.splitTextToSize(rec.explanation.whyFits, pageWidth - margin * 2);
        doc.text(whyFitsLines, margin, yPos);
        yPos += whyFitsLines.length * 5 + 5;

        // Key contributors
        doc.setFont('helvetica', 'bold');
        doc.text('Key Contributors:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        const contributorsText = rec.explanation.keyContributors.join(', ');
        const contributorsLines = doc.splitTextToSize(contributorsText, pageWidth - margin * 2 - 50);
        doc.text(contributorsLines, margin + 55, yPos);
        yPos += contributorsLines.length * 5 + 5;

        // Academic feasibility
        doc.setFont('helvetica', 'bold');
        doc.text('Academic Feasibility:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        const feasibilityLines = doc.splitTextToSize(rec.explanation.academicFeasibility, pageWidth - margin * 2);
        yPos += 5;
        doc.text(feasibilityLines, margin, yPos);
        yPos += feasibilityLines.length * 5 + 5;

        // Next steps
        if (rec.explanation.nextSteps && rec.explanation.nextSteps.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Suggested Next Steps:', margin, yPos);
          yPos += 5;
          doc.setFont('helvetica', 'normal');
          rec.explanation.nextSteps.forEach((step) => {
            doc.text(`• ${step}`, margin + 5, yPos);
            yPos += 5;
          });
        }

        yPos += 10; // Space between recommendations
      });

      // Footer on all pages
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `TopCoach Psychometric Assessment • Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
        doc.text(
          'Generated by TopCoach AI',
          pageWidth - margin,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'right' }
        );
      }

      // Save PDF
      const filename = `psychometric-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      message.success('PDF exported successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Failed to generate PDF');
    }
  };

  return (
    <Button size="large" onClick={generatePdf}>
      <FontAwesomeIcon icon="file-pdf" style={{ marginRight: 8 }} />
      Download PDF Report
    </Button>
  );
};

export default PdfExport;

