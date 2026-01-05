import React from 'react';
import { Button, Modal } from 'antd';
import { DownloadOutlined, EyeOutlined, CloseOutlined } from '@ant-design/icons';
import styles from './ImagePreview.module.scss';

interface ImagePreviewProps {
  imageUrl: string;
  fileName?: string;
  fileSize?: number;
  onDownload?: () => void;
  onClose?: () => void;
  showDownload?: boolean;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUrl,
  fileName,
  fileSize,
  onDownload,
  onClose,
  showDownload = true,
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = fileName || 'image';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className={styles.imagePreview}>
        <div className={styles.imageContainer} onClick={handleImageClick}>
          <img src={imageUrl} alt={fileName || 'Image'} className={styles.image} />
          <div className={styles.overlay}>
            <EyeOutlined className={styles.viewIcon} />
          </div>
        </div>
        <div className={styles.imageInfo}>
          {fileName && (
            <span className={styles.fileName} title={fileName}>
              {fileName}
            </span>
          )}
          {fileSize && (
            <span className={styles.fileSize}>{formatFileSize(fileSize)}</span>
          )}
        </div>
        <div className={styles.imageActions}>
          {showDownload && (
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
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
              icon={<CloseOutlined />}
              onClick={onClose}
              className={styles.closeButton}
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width="90%"
        style={{ maxWidth: '800px' }}
        centered
      >
        <div className={styles.modalImageContainer}>
          <img src={imageUrl} alt={fileName || 'Image'} className={styles.modalImage} />
        </div>
      </Modal>
    </>
  );
};

export default ImagePreview;

