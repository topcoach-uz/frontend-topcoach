import React, { useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import {
  Download,
  Eye,
  FileText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { Document, Page } from 'react-pdf';
import { ACCESS_TOKEN } from 'src/constants/storage';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './pdfWorker';
import './PDFViewer.scss';

/**
 * Editorial-style PDF viewer.
 *
 * Renders the PDF inline as a scrollable column of canvas pages with our
 * own thin toolbar. Replaces the previous Google Drive iframe embed that
 * had a black letterbox + Drive chrome.
 *
 * Source handling: PDFs hosted on Google Drive can't be fetched directly
 * from the browser due to CORS, so we route them through the existing
 * backend proxy at /api/course-admin/courses/proxy-pdf and pass react-pdf the
 * resulting blob. Same-origin PDFs are passed by URL.
 */

interface PDFViewerProps {
  pdfUrl: string;
  lessonId: string;
  title: string;
  onComplete?: () => void;
  isCompleted?: boolean;
  /**
   * When false, the Mark-as-complete button is disabled. Used by the
   * parent to gate completion behind the 80% quiz threshold when the
   * lesson has tasks attached.
   */
  canComplete?: boolean;
  /** Optional tooltip shown when Mark-as-complete is disabled. */
  completeLockReason?: string;
}

const isGoogleDriveUrl = (url: string) =>
  url.includes('drive.google.com') || url.includes('docs.google.com');

const cleanFilename = (title: string) =>
  `${title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}.pdf`;

const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfUrl,
  title,
  onComplete,
  isCompleted = false,
  canComplete = true,
  completeLockReason,
}) => {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(720);
  const [isDownloading, setIsDownloading] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const isDriveUrl = useMemo(() => isGoogleDriveUrl(pdfUrl), [pdfUrl]);

  // Resize observer keeps the page width tracking the column.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        if (w > 0) setContainerWidth(w);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fetch PDF. For Drive, go through the backend proxy (CORS); otherwise
  // hand react-pdf the URL directly via the Document `file` prop below.
  useEffect(() => {
    if (!pdfUrl) return;
    if (!isDriveUrl) {
      setPdfBlob(null);
      setPdfError(null);
      return;
    }
    let cancelled = false;
    const fetchViaProxy = async () => {
      setPdfBlob(null);
      setPdfError(null);
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const proxyUrl = `/api/course-admin/courses/proxy-pdf?url=${encodeURIComponent(pdfUrl)}`;
        const res = await fetch(proxyUrl, { headers });
        if (!res.ok) throw new Error(`Proxy failed: ${res.status}`);
        const blob = await res.blob();
        if (!cancelled) setPdfBlob(blob);
      } catch (err) {
        if (!cancelled) {
          console.error('PDF proxy fetch failed:', err);
          setPdfError(
            "This Google Drive file isn't publicly accessible. Open it in a new tab or download below.",
          );
        }
      }
    };
    void fetchViaProxy();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl, isDriveUrl]);

  // Track which page is currently centered in the viewport.
  useEffect(() => {
    if (numPages === 0) return;
    const observers: IntersectionObserver[] = [];
    Object.entries(pageRefs.current).forEach(([pageStr, el]) => {
      if (!el) return;
      const page = Number(pageStr);
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting && e.intersectionRatio > 0.5) {
              setCurrentPage(page);
            }
          });
        },
        { threshold: [0.5] },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [numPages]);

  const onDocumentLoadSuccess = ({ numPages: total }: { numPages: number }) => {
    setNumPages(total);
    setPdfError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    console.error('PDF render failed:', err);
    setPdfError('The PDF could not be rendered. Open in a new tab or download below.');
  };

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    message.loading({ content: 'Preparing PDF…', key: 'pdf-download' });
    try {
      let blob = pdfBlob;
      if (!blob) {
        const token = localStorage.getItem(ACCESS_TOKEN);
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const proxyUrl = isDriveUrl
          ? `/api/course-admin/courses/proxy-pdf?url=${encodeURIComponent(pdfUrl)}`
          : pdfUrl;
        const res = await fetch(proxyUrl, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        blob = await res.blob();
      }
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = cleanFilename(title);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      message.success({ content: 'Downloaded.', key: 'pdf-download' });
    } catch (err) {
      console.error('Download failed:', err);
      message.error({ content: 'Download failed — opening in new tab.', key: 'pdf-download' });
      window.open(pdfUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMarkComplete = () => onComplete?.();

  const goPrev = () => {
    const target = Math.max(1, currentPage - 1);
    pageRefs.current[target]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const goNext = () => {
    const target = Math.min(numPages, currentPage + 1);
    pageRefs.current[target]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const zoomIn = () => setScale((s) => Math.min(2.4, s + 0.15));
  const zoomOut = () => setScale((s) => Math.max(0.6, s - 0.15));
  const resetZoom = () => setScale(1);

  const fileProp = pdfBlob ?? (isDriveUrl ? null : pdfUrl);
  const pageWidth = Math.max(320, Math.floor(containerWidth * scale));

  return (
    <section className="pdf-frame">
      {/* Toolbar */}
      <div className="pdf-toolbar" role="toolbar" aria-label="PDF controls">
        <div className="pdf-toolbar__group">
          <button
            type="button"
            className="pdf-toolbar__icon-btn"
            onClick={goPrev}
            disabled={numPages === 0 || currentPage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="pdf-toolbar__counter">
            <strong>{numPages === 0 ? '—' : currentPage}</strong>
            <span aria-hidden> / </span>
            <span>{numPages || '—'}</span>
          </span>
          <button
            type="button"
            className="pdf-toolbar__icon-btn"
            onClick={goNext}
            disabled={numPages === 0 || currentPage >= numPages}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="pdf-toolbar__group pdf-toolbar__group--center">
          <button
            type="button"
            className="pdf-toolbar__icon-btn"
            onClick={zoomOut}
            disabled={scale <= 0.6}
            aria-label="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            className="pdf-toolbar__zoom-pct"
            onClick={resetZoom}
            title="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            className="pdf-toolbar__icon-btn"
            onClick={zoomIn}
            disabled={scale >= 2.4}
            aria-label="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            className="pdf-toolbar__icon-btn"
            onClick={resetZoom}
            aria-label="Fit width"
            title="Fit width"
          >
            <Maximize2 size={13} />
          </button>
        </div>

        <div className="pdf-toolbar__group pdf-toolbar__group--right">
          <button type="button" className="pdf-toolbar__link" onClick={handleOpenInNewTab}>
            <Eye size={13} /> Open
          </button>
          <button
            type="button"
            className="pdf-toolbar__link"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download size={13} /> {isDownloading ? 'Preparing…' : 'Download'}
          </button>
        </div>
      </div>

      {/* Document */}
      <div ref={containerRef} className="pdf-frame__pages">
        {pdfError ? (
          <div className="pdf-frame__fallback">
            <FileText size={22} className="pdf-frame__fallback-icon" aria-hidden />
            <h3>PDF preview unavailable</h3>
            <p>{pdfError}</p>
            <div className="pdf-frame__fallback-actions">
              <button type="button" className="pdf-frame__link" onClick={handleOpenInNewTab}>
                <Eye size={13} /> Open in new tab
              </button>
              <button
                type="button"
                className="pdf-frame__link"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                <Download size={13} /> {isDownloading ? 'Preparing…' : 'Download'}
              </button>
            </div>
          </div>
        ) : fileProp == null ? (
          <p className="pdf-frame__loading">
            <em>Loading PDF…</em>
          </p>
        ) : (
          <Document
            file={fileProp}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <p className="pdf-frame__loading">
                <em>Loading PDF…</em>
              </p>
            }
            error={
              <p className="pdf-frame__loading">
                <em>Couldn't render this PDF.</em>
              </p>
            }
          >
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <div
                key={pageNum}
                ref={(el) => {
                  pageRefs.current[pageNum] = el;
                }}
                className="pdf-frame__page"
              >
                <Page
                  pageNumber={pageNum}
                  width={pageWidth}
                  renderAnnotationLayer={false}
                  renderTextLayer
                />
              </div>
            ))}
          </Document>
        )}
      </div>

      {/* Action row */}
      <div className="pdf-frame__actions">
        {!isCompleted ? (
          <button
            type="button"
            className="pdf-frame__link pdf-frame__link--primary"
            onClick={handleMarkComplete}
            disabled={!canComplete}
            title={!canComplete ? (completeLockReason ?? 'Complete the practice questions first.') : undefined}
          >
            <CheckCircle2 size={13} /> Mark as complete
          </button>
        ) : (
          <span className="pdf-frame__done">
            <CheckCircle2 size={13} /> <em>Marked complete</em>
          </span>
        )}
        {!isCompleted && !canComplete && (
          <span className="pdf-frame__lock-note">
            <em>{completeLockReason ?? 'Complete the practice questions (80%) to unlock.'}</em>
          </span>
        )}
      </div>
    </section>
  );
};

export default PDFViewer;
