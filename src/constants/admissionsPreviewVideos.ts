/**
 * Same three YouTube previews as the admissions landing page (`VideoPreviewSection` on programs/admissions).
 * Keep IDs/thumbnails in sync with this file only.
 */
export const ADMISSIONS_YOUTUBE_PREVIEW_SPECS = [
  {
    id: '1',
    youtubeId: 'uaC3wW4JIJA',
    thumbnail: '/img/module2-cover.jpeg',
    duration: '7:17',
    titleKey: 'videoPreview.video2.title',
    descriptionKey: 'videoPreview.video2.description',
  },
  {
    id: '2',
    youtubeId: 'le6QJNo5D_0',
    thumbnail: '/img/module3-cover.jpeg',
    duration: '4:09',
    titleKey: 'videoPreview.video1.title',
    descriptionKey: 'videoPreview.video1.description',
  },
  {
    id: '3',
    youtubeId: 'qb48VUSmA_w',
    thumbnail: '/img/module4-cover.jpeg',
    duration: '4:44',
    titleKey: 'videoPreview.video3.title',
    descriptionKey: 'videoPreview.video3.description',
  },
] as const;

export type AdmissionsYoutubePreviewSpec = (typeof ADMISSIONS_YOUTUBE_PREVIEW_SPECS)[number];

export function admissionsPreviewEmbedUrl(youtubeId: string, autoplay = true): string {
  const ap = autoplay ? 1 : 0;
  return `https://www.youtube.com/embed/${youtubeId}?autoplay=${ap}&rel=0`;
}
