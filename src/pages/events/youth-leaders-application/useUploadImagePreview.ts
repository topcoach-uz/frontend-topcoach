import { useEffect, useState, type MutableRefObject } from 'react';

/**
 * Object URL for Ant Design Upload `picture-card` preview. Keeps a `File` in a parent ref
 * so previews survive step navigation (draft only stores the filename).
 */
export function useUploadImagePreview(
  fileName: string,
  fileRef: MutableRefObject<File | null>,
): string | null {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    const f = fileRef.current;
    if (fileName && f && f.name === fileName && f.type.startsWith('image/')) {
      url = URL.createObjectURL(f);
    }
    setPreviewUrl(url);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [fileName]);

  return previewUrl;
}
