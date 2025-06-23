import { GetProp } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import { UploadProps } from 'antd/lib';
import dayjs from 'dayjs';
import { MEDIA_TAGS, MediaSchema } from 'src/app/api/Api';

export const clearMask = (val: string) => {
  return val
    .replaceAll(' ', '')
    .replaceAll('(', '')
    .replaceAll(')', '')
    .replaceAll('-', '');
};

export const makePhoneMask = (val: string) => {
  return `(${val[0] + val[1]})-${val[2] + val[3] + val[4]}-${val[5] + val[6]}-${
    val[7] + val[8]
  }`;
};

export const handlePreviewFile = async (file: UploadFile) => {
  let src = file?.url as string;
  if (!src) {
    src = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file.originFileObj as RcFile);
      reader.onload = () => resolve(reader.result as string);
    });
  }
  const image = new Image();
  image.src = src;
  const imgWindow = window.open(src);
  imgWindow?.document.write(image.outerHTML);
};

export const redirectToNewTab = (url: string) => {
  window.open(url, '_blank');
};

export const prettierNumber = (val: number | undefined, seperator?: string) => {
  if (val) {
    let val_arr = val.toString().split('.');
    let number = val_arr[0].split('').reverse();
    let number_rest = val_arr[1] ? '.' + val_arr[1] : '';
    let prettier_number_arr: string[] = [];

    number.forEach((item, index) => {
      if (index > 0 && index % 3 === 0)
        prettier_number_arr.push(seperator || ',');
      prettier_number_arr.push(item);
    });

    return prettier_number_arr.reverse().join('') + number_rest;
  } else return '';
};

export const prettierPhone = (val: string) => {
  return `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 9)}-${val.slice(
    9,
    11
  )}-${val.slice(11, 13)}`;
};

export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export function countWords(str: string): number {
  // Handle empty string edge case
  if (str.trim().length === 0) return 0;

  return str
    .trim() // Remove leading/trailing whitespace
    .split(/\s+/) // Split by any whitespace sequence
    .filter((word) => word.length > 0).length; // Extra safety for empty strings
}

export type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];
export const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[@$!%*?&]/.test(password)) score += 1;
  return score;
};

// export const formatDate = (val: Dayjs, format = monthFormat) => {
//   return dayjs(val).format(format);
// };

export const createArray = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

// date
export const formatDateWithoutTime = (datetimeStr: string): string => {
  // Convert ISO date string to a Date object
  const date = new Date(datetimeStr);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();

  return `${day}.${month}.${year}`;
};

export const formatDate = (datetimeStr: string): string => {
  const date = new Date(datetimeStr);

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}.${month}.${year}, ${hours}:${minutes}`;
};

export const getDateTime = (datetimeStr: string): string => {
  const date = new Date(datetimeStr);

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
};

export const getLatestCreatedImg = (
  media: MediaSchema[],
  mediaTag: MEDIA_TAGS = MEDIA_TAGS.ProfilePicture
) => {
  const profileImages = media
    .filter((media) => media?.tags?.includes(mediaTag) || media?.tags === null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return profileImages?.[0]?.url;
};

export const getLatestVideo = (media: MediaSchema[], mediaTag: MEDIA_TAGS) => {
  if (!Array.isArray(media)) return '';

  const profileImages = media
    .filter(
      (media) => Array.isArray(media.tags) && media?.tags?.includes(mediaTag)
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return profileImages?.[0]?.url ?? '';
};

// Throttling function
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return function (...args: Parameters<T>): void {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    func(...args);
  };
}

export const isProduction = () => {
  const hostname = window.location.hostname;
  return (
    hostname !== 'localhost' &&
    hostname !== '127.0.0.1' &&
    !hostname.startsWith('192.') &&
    hostname !== 'localhost:5173'
  );
};

export const formatDateRange = (startDate: string, endDate: string) => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  // If same day, show just one date
  if (start.isSame(end, 'day')) {
    return start.format('MMMM Do, YYYY');
  }

  // If same month, show: "October 17 - 19, 2024"
  if (start.isSame(end, 'month')) {
    return `${start.format('MMMM Do')} - ${end.format('Do, YYYY')}`;
  }

  // If different months, show: "October 17 - November 19, 2024"
  if (start.isSame(end, 'year')) {
    return `${start.format('MMMM Do')} - ${end.format('MMMM Do, YYYY')}`;
  }

  // If different years, show full dates
  return `${start.format('MMMM Do, YYYY')} - ${end.format('MMMM Do, YYYY')}`;
};
