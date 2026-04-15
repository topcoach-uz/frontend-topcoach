/** Youth / international forum registration — frontend draft model (API will mirror later). */

export const THEMATIC_CLUSTER_OPTIONS = [
  {
    id: 'asean-green',
    label:
      'China-ASEAN Youth Development Forum and WYDF Thematic Forum on Green Development (15th China-ASEAN Youth Campus), Guangxi, Nanning',
  },
  {
    id: 'digital-ceec',
    label:
      'Digital Development (2024 "Bridge to the Future" China-Central and Eastern Europe Youth Exchange Camp), Chongqing',
  },
  {
    id: 'culture-apgyd',
    label: 'Culture Inheritance and Innovation (APGYD Youth Leadership Campus), Changsha, Hunan',
  },
  {
    id: 'youth-cities',
    label: 'Youth Development-Oriented Cities (Asia-Europe Young Leaders Campus), Hangzhou, Zhejiang',
  },
  { id: 'none', label: 'None' },
] as const;

export type ThematicClusterId = (typeof THEMATIC_CLUSTER_OPTIONS)[number]['id'];

export interface PersonalInfo {
  familyName: string;
  middleName: string;
  givenName: string;
  email: string;
  /** Full phone number including country code (e.g. +998946769641) */
  mobile: string;
  dateOfBirth: string;
  nationality: string;
  dietary: 'none' | 'halal' | 'vegetarian' | 'other' | '';
  organization: string;
  position: string;
  idPhotoFileName: string;
  portraitPhotoFileName: string;
}

export interface IdInfo {
  passportNumber: string;
  passportExpiry: string;
  passportScanFileName: string;
  needsVisa: 'yes' | 'no' | '';
  visaApplicationPlace: string;
  programName: string;
}

export interface ContactInfo {
  address: string;
  whatsapp: string;
  twitter: string;
  instagram: string;
  wechat: string;
  shortBio: string;
  resumeFileName: string;
  wydfTopic: string;
}

export interface ArrivalDeparture {
  arrivalAirport: string;
  arrivalDate: string;
  arrivalTime: string;
  arrivalFlight: string;
  departureAirport: string;
  departureDate: string;
  departureTime: string;
  departureFlight: string;
}

export interface YouthLeadersDraft {
  personal: PersonalInfo;
  idInfo: IdInfo;
  thematicClusterId: ThematicClusterId | '';
  contact: ContactInfo;
  arrival: ArrivalDeparture;
}

export const STORAGE_KEY = 'topcoach_youth_leaders_application_draft';

export const STEP_TITLES = [
  'Personal Information',
  'ID Information',
  'Thematic Clusters',
  'Contact Information',
  'Arrival and Departure Information',
] as const;

export function createEmptyDraft(): YouthLeadersDraft {
  return {
    personal: {
      familyName: '',
      middleName: '',
      givenName: '',
      email: '',
      mobile: '',
      dateOfBirth: '',
      nationality: '',
      dietary: '',
      organization: '',
      position: '',
      idPhotoFileName: '',
      portraitPhotoFileName: '',
    },
    idInfo: {
      passportNumber: '',
      passportExpiry: '',
      passportScanFileName: '',
      needsVisa: '',
      visaApplicationPlace: '',
      programName: '',
    },
    thematicClusterId: '',
    contact: {
      address: '',
      whatsapp: '',
      twitter: '',
      instagram: '',
      wechat: '',
      shortBio: '',
      resumeFileName: '',
      wydfTopic: '',
    },
    arrival: {
      arrivalAirport: '',
      arrivalDate: '',
      arrivalTime: '',
      arrivalFlight: '',
      departureAirport: '',
      departureDate: '',
      departureTime: '',
      departureFlight: '',
    },
  };
}

export function mergeDraftFromStorage(parsed: Partial<YouthLeadersDraft> | null | undefined): YouthLeadersDraft {
  const empty = createEmptyDraft();
  if (!parsed || typeof parsed !== 'object') return empty;
  return {
    personal: { ...empty.personal, ...parsed.personal },
    idInfo: { ...empty.idInfo, ...parsed.idInfo },
    thematicClusterId: (parsed.thematicClusterId ?? empty.thematicClusterId) as YouthLeadersDraft['thematicClusterId'],
    contact: { ...empty.contact, ...parsed.contact },
    arrival: { ...empty.arrival, ...parsed.arrival },
  };
}

/** True if the user has entered anything beyond an empty draft (for “resume” vs “start”). */
export function isDraftMeaningful(d: YouthLeadersDraft): boolean {
  const empty = createEmptyDraft();
  return JSON.stringify(d) !== JSON.stringify(empty);
}
