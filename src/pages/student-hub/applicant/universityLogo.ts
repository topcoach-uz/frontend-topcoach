import type { UniversitiesSchema } from 'src/app/api/Api';
import catalogueUniversityLogos from './catalogueUniversityLogos.json';

type UniversityWithLogo = Pick<UniversitiesSchema, 'id' | 'media'> & {
  logoUrl?: string | null;
  logoSourceUrl?: string | null;
  logoVerifiedAt?: string | null;
};

// UCLA publishes this campus logo in its own design system. Keep this
// temporary fallback until the reviewed logo URL is entered in the catalogue.
const REVIEWED_LOGOS: Record<string, string> = {
  '1b921b70-2639-4d05-8559-36b77211852d': 'https://www.ucla.edu/img/logo-ucla.svg',
};
const LOCAL_LOGOS: Record<string, string> = {
  // NTU's official image responds to direct fetches but blocks browser hotlinking.
  '37714cb3-5891-43e9-ba62-204dc6cfad42': '/official-university-logos/nanyang-technological-university.png',
  // Refresh the cached SVG after adding its required xlink namespace.
  '4a1b7815-982b-44a6-bc62-7f740d7b47f1': '/official-university-logos/freie-universitat-berlin.svg?v=2',
};

const catalogueLogosById = new Map(catalogueUniversityLogos.map((item) => [item.id, item]));

// Catalogue entries store absolute production URLs, but every file is also
// shipped in public/official-university-logos. Serve the bundled copy so logos
// load on any host (local dev, staging, production) without a cross-site fetch.
const BUNDLED_LOGO_PATH = /^https:\/\/(?:www\.)?topcoachuni\.com(\/official-university-logos\/[^?#]+)/;
function toBundledLogoUrl(url: string): string {
  const match = BUNDLED_LOGO_PATH.exec(url);
  return match ? match[1] : url;
}

export function getUniversityLogoUrl(university: UniversityWithLogo): string | undefined {
  if (LOCAL_LOGOS[university.id]) return LOCAL_LOGOS[university.id];
  if ((university.logoUrl?.startsWith('https://') || university.logoUrl?.startsWith('/official-university-logos/')) && university.logoSourceUrl?.startsWith('https://') && university.logoVerifiedAt) return university.logoUrl;
  if (REVIEWED_LOGOS[university.id]) return REVIEWED_LOGOS[university.id];
  const catalogueLogo = catalogueLogosById.get(university.id);
  if (catalogueLogo) return toBundledLogoUrl(catalogueLogo.logoUrl);
  return university.media?.find((item) => item.tags?.some((tag) => tag.toLowerCase() === 'official-logo'))?.url;
}

export function universityLogoNeedsDarkBackground(url?: string): boolean {
  return Boolean(url && (url.includes('ucla.edu/img/logo-ucla.svg') || /(?:white|reversed|negative|inverse|[-_]ko\.|[-_]light|[-_]blanc)/i.test(url)));
}
