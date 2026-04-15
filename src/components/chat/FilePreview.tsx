import React from 'react';
import { Button, Space } from 'antd';
import { Download, FileText, X } from 'lucide-react';
import { Typography } from 'antd';
import styles from './FilePreview.module.scss';

const { Text } = Typography;

interface FilePreviewProps {
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  fileMimeType?: string;
  onDownload?: () => void;
  onClose?: () => void;
  showDownload?: boolean;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  fileUrl,
  fileName,
  fileSize,
  fileMimeType,
  onDownload,
  onClose,
  showDownload = true,
}) => {
  const getFileIcon = () => {
    if (fileMimeType) {
      if (fileMimeType === 'application/pdf') {
        return <FileText size={16} className={styles.fileIcon} style={{ color: '#d32f2f' }} />;
      }
      if (
        fileMimeType === 'application/msword' ||
        fileMimeType ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        return <FileText size={16} className={styles.fileIcon} style={{ color: '#2b579a' }} />;
      }
    }
    return <FileText size={16} className={styles.fileIcon} />;
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={styles.filePreview}>
      <div className={styles.fileInfo}>
        <div className={styles.fileIconContainer}>{getFileIcon()}</div>
        <div className={styles.fileDetails}>
          <Text className={styles.fileName} title={fileName}>
            {fileName}
          </Text>
          {fileSize && (
            <Text type="secondary" className={styles.fileSize}>
              {formatFileSize(fileSize)}
            </Text>
          )}
        </div>
      </div>
      <div className={styles.fileActions}>
        {showDownload && (
          <Button
            type="text"
            size="small"
            icon={<Download size={16} />}
            onClick={handleDownload}
            className={styles.downloadButton}
          >
            Download
          </Button>
        )}
        {onClose && (
          <Button
            type="text"
            size="small"
            icon={<X size={16} />}
            onClick={onClose}
            className={styles.closeButton}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilePreview;

