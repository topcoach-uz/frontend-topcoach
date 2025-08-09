import React, { useState, useEffect } from 'react';
import { Card, Button, message, Tooltip } from 'antd';
import { 
  DownloadOutlined, 
  EyeOutlined,
  FileTextOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { ACCESS_TOKEN } from 'src/constants/storage';
import './PDFViewer.scss';

interface PDFViewerProps {
  pdfUrl: string;
  lessonId: string;
  title: string;
  onComplete?: () => void;
  isCompleted?: boolean;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  pdfUrl, 
  lessonId, 
  title, 
  onComplete,
  isCompleted = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Debug: Log completion status
  useEffect(() => {
    console.log('PDFViewer completion status:', {
      lessonId,
      title,
      isCompleted,
      timestamp: new Date().toISOString()
    });
  }, [lessonId, title, isCompleted]);

  // Check if this is an external URL
  const isExternalUrl = !pdfUrl.startsWith(window.location.origin) && !pdfUrl.startsWith('/');
  const downloadButtonText = isExternalUrl ? 'Open PDF' : 'Download PDF';

  const handleDownload = async () => {
    setIsLoading(true);
    message.loading('Preparing PDF download...', 0);
    
    try {
      // Check if the URL is external (different origin)
      const urlObj = new URL(pdfUrl);
      const isExternal = urlObj.origin !== window.location.origin;
      
      if (isExternal) {
        // For external URLs, use our backend proxy to avoid CORS
        message.destroy();
        
        try {
          // Use our backend proxy to fetch the external PDF
          const token = localStorage.getItem(ACCESS_TOKEN);
          const headers: Record<string, string> = {};
          
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const proxyUrl = `/api/admin/courses/proxy-pdf?url=${encodeURIComponent(pdfUrl)}`;
          const response = await fetch(proxyUrl, {
            method: 'GET',
            headers,
          });
          
          if (!response.ok) {
            throw new Error(`Proxy failed: ${response.status}`);
          }
          
          // Get the PDF as a blob
          const pdfBlob = await response.blob();
          
          // Create a blob URL
          const blobUrl = window.URL.createObjectURL(pdfBlob);
          
          // Create a temporary link to download the PDF
          const link = document.createElement('a');
          link.href = blobUrl;
          
          // Create a clean filename
          const cleanTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
          link.download = `${cleanTitle}.pdf`;
          link.style.display = 'none';
          
          // Add to DOM, click, and remove
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the blob URL
          window.URL.revokeObjectURL(blobUrl);
          
          message.destroy();
          message.success('PDF downloaded successfully');
          
        } catch (proxyError) {
          console.error('Proxy download error:', proxyError);
          message.destroy();
          
          // Fallback: try direct download with user instruction
          message.info('Proxy unavailable. Trying alternative method...');
          
          // Show user instruction for manual download
          message.info('Right-click the PDF link and select "Save as..." to download');
          
          // Open PDF in new tab for manual download
          window.open(pdfUrl, '_blank');
        }
      } else {
        // For same-origin URLs, we can fetch and download
        const token = localStorage.getItem(ACCESS_TOKEN);
        const headers: Record<string, string> = {};
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(pdfUrl, {
          method: 'GET',
          headers,
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }
        
        // Get the PDF as a blob
        const pdfBlob = await response.blob();
        
        // Create a blob URL
        const blobUrl = window.URL.createObjectURL(pdfBlob);
        
        // Create a temporary link to download the PDF
        const link = document.createElement('a');
        link.href = blobUrl;
        
        // Create a clean filename
        const cleanTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
        link.download = `${cleanTitle}.pdf`;
        link.style.display = 'none';
        
        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);
        
        message.destroy();
        message.success('PDF downloaded successfully');
      }
    } catch (error) {
      console.error('Download error:', error);
      message.destroy();
      
      // Final fallback: open in new tab
      message.error('Download failed. Opening PDF in new tab instead.');
      window.open(pdfUrl, '_blank');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  const handleMarkAsComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <Card className="pdf-viewer-card" title={title}>
      <div className="pdf-container">
        <div className="pdf-preview">
          <div className="pdf-icon">
            <FileTextOutlined />
          </div>
          <h3>{title}</h3>
          <p>
            Click the buttons below to view or download this PDF document.
          </p>
        </div>

        <div className="pdf-actions">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={handleViewInNewTab}
            size="large"
            className="view-button"
          >
            View PDF
          </Button>
          
          <Tooltip title={isExternalUrl ? "Opens PDF in a new tab" : "Downloads PDF"}>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              loading={isLoading}
              size="large"
              className="download-button"
            >
              {downloadButtonText}
            </Button>
          </Tooltip>

          {!isCompleted && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleMarkAsComplete}
              size="large"
              className="complete-button"
              style={{ backgroundColor: '#8b0000', borderColor: '#8b0000' }}
            >
              Mark as Complete
            </Button>
          )}

          {isCompleted && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              size="large"
              className="completed-button"
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              disabled
            >
              Completed
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PDFViewer; 