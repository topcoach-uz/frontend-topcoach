import { Upload, message } from 'antd';

/** Max file size for images and documents in this application (MiB). */
export const MAX_UPLOAD_MB = 5;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/**
 * Use with `beforeUpload` when files are handled manually (`return false` after accept).
 * Rejects oversize files and keeps them out of the file list.
 */
export function beforeUploadRejectOverSize(file: File): boolean | typeof Upload.LIST_IGNORE {
  if (file.size > MAX_UPLOAD_BYTES) {
    message.error(`File must be ${MAX_UPLOAD_MB} MB or smaller.`);
    return Upload.LIST_IGNORE;
  }
  return false;
}
