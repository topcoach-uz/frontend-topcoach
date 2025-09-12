import React, { useState, useEffect } from 'react';
import { Card, Button, message, Tooltip, Alert } from 'antd';
import { 
  DownloadOutlined, 
  EyeOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
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
  const [iframeError, setIframeError] = useState(false);
  const [isGoogleDrive, setIsGoogleDrive] = useState(false);

  // Debug: Log completion status
  useEffect(() => {
    console.log('PDFViewer completion status:', {
      lessonId,
      title,
      isCompleted,
      timestamp: new Date().toISOString()
    });
  }, [lessonId, title, isCompleted]);

  // Check if this is a Google Drive URL
  useEffect(() => {
    const isGoogleDriveUrl = pdfUrl.includes('drive.google.com') || pdfUrl.includes('docs.google.com');
    setIsGoogleDrive(isGoogleDriveUrl);
    
    if (isGoogleDriveUrl) {
      console.log('Detected Google Drive URL:', pdfUrl);
    }
  }, [pdfUrl]);

  // Check if this is an external URL
  const isExternalUrl = !pdfUrl.startsWith(window.location.origin) && !pdfUrl.startsWith('/');
  const downloadButtonText = 'Download PDF';

  // Convert Google Drive URL to direct download URL
  const getGoogleDriveDirectUrl = (url: string) => {
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.match(/\/file\/d\/([^\/]+)/)?.[1];
      if (fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }
    return url;
  };

  // Convert Google Drive URL to embed URL
  const getGoogleDriveEmbedUrl = (url: string) => {
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.match(/\/file\/d\/([^\/]+)/)?.[1];
      if (fileId) {
        // Try different Google Drive embed formats
        return `https://drive.google.com/file/d/${fileId}/preview?usp=sharing`;
      }
    }
    return url;
  };

  // Get the appropriate URL for iframe
  const getIframeUrl = () => {
    if (isGoogleDrive) {
      return getGoogleDriveEmbedUrl(pdfUrl);
    }
    return pdfUrl;
  };

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
          console.error('Proxy download failed:', proxyError);
          message.destroy();
          
          // Fallback: open in new tab
          message.warning('Direct download failed. Opening PDF in new tab.');
          window.open(pdfUrl, '_blank');
        }
      } else {
        // For internal URLs, use direct download
        const response = await fetch(pdfUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const pdfBlob = await response.blob();
        const blobUrl = window.URL.createObjectURL(pdfBlob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        const cleanTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
        link.download = `${cleanTitle}.pdf`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
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

  const handleIframeError = () => {
    console.error('PDF iframe failed to load');
    setIframeError(true);
  };

  const handleIframeLoad = () => {
    console.log('PDF iframe loaded successfully');
    setIframeError(false);
  };

  return (
    <Card className="pdf-viewer-card" title={title}>
      <div className="pdf-container">
        {/* PDF Actions - Keep the three buttons */}
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

        {/* Google Drive Warning */}
        {/* {isGoogleDrive && (
          <Alert
            message="Google Drive PDF"
            description="This PDF is hosted on Google Drive. If you can't view it directly, the 'View PDF' and 'Open PDF' buttons above will open it in a new tab."
            type="info"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: '16px' }}
          />
        )} */}

        {/* PDF Content - Show PDF directly on website */}
        <div className="pdf-content">
          {iframeError ? (
            <div className="pdf-error-fallback">
              <div className="pdf-icon">
                <FileTextOutlined />
              </div>
              <h3>PDF Preview Unavailable</h3>
              <p>
                {isGoogleDrive 
                  ? "This Google Drive file is not publicly accessible. Please contact your instructor to make the file public or use the download button below."
                  : "The PDF cannot be displayed directly due to access restrictions. Please use the buttons above to view or download the PDF."
                }
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <Button 
                  type="primary" 
                  onClick={handleViewInNewTab}
                  icon={<EyeOutlined />}
                >
                  Open PDF in New Tab
                </Button>
                <Button 
                  onClick={handleDownload}
                  icon={<DownloadOutlined />}
                  loading={isLoading}
                >
                  Download PDF
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              src={getIframeUrl()}
              title={title}
              width="100%"
              height="600px"
              style={{ border: 'none', borderRadius: '8px' }}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
            />
          )}
        </div>
      </div>
    </Card>
  );
};

export default PDFViewer; 