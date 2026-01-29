// 🎨 Unified Icon Constants for Student Hub
// Centralized icon management for consistent usage
// Uses UnifiedIcon component with react-icons (Feather Icons primary, FontAwesome fallback)

// Profile Icons
export const PROFILE_ICONS = {
  PROFILE: 'user',
  ACADEMIC: 'graduation-cap',
  PERSONAL: 'user-circle',
  ACTIVITIES: 'trophy',
  DOCUMENTS: 'file-alt',
  OVERVIEW: 'chart-line',
  SETTINGS: 'settings',
} as const;

// Application Icons
export const APPLICATION_ICONS = {
  APPLICATIONS: 'university',
  TASKS: 'tasks',
  SCHOLARSHIPS: 'award',
  TIMELINE: 'calendar',
  DEADLINES: 'clock',
  STATUS: 'flag',
  PRIORITY: 'exclamation',
} as const;

// Essay Icons
export const ESSAY_ICONS = {
  ESSAYS: 'pen',
  TEMPLATES: 'file-text',
  FEEDBACK: 'comments',
  AI: 'brain',
  VERSIONS: 'code-branch',
  COLLABORATION: 'users',
  ANALYSIS: 'chart-line',
} as const;

// AI Major Match Icons
export const AI_MAJOR_MATCH_ICONS = {
  AI_MAJOR_MATCH: 'target',
  AI_ANALYSIS: 'microscope',
  AI_RECOMMENDATION: 'lightbulb',
} as const;

// Navigation Icons
export const NAVIGATION_ICONS = {
  DASHBOARD: 'home',
  PROFILE: 'user',
  APPLICATIONS: 'university',
  ESSAYS: 'pen',
  DOCUMENTS: 'file-text',
  NOTIFICATIONS: 'bell',
  SETTINGS: 'settings',
  HELP: 'help-circle',
  LOGOUT: 'logout',
} as const;

// Action Icons
export const ACTION_ICONS = {
  ADD: 'plus',
  EDIT: 'edit',
  DELETE: 'trash',
  SAVE: 'save',
  CANCEL: 'x',
  CHECK: 'check',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  COPY: 'copy',
  SHARE: 'share',
  PRINT: 'print',
  SEARCH: 'search',
  FILTER: 'filter',
  SORT: 'sort',
  REFRESH: 'refresh',
} as const;

// Status Icons
export const STATUS_ICONS = {
  SUCCESS: 'check-circle',
  WARNING: 'alert-circle',
  ERROR: 'alert-circle',
  INFO: 'info',
  LOADING: 'spinner',
  PENDING: 'clock',
  COMPLETE: 'check',
  INCOMPLETE: 'x',
} as const;

// Priority Icons
export const PRIORITY_ICONS = {
  LOW: 'arrow-down',
  MEDIUM: 'minus',
  HIGH: 'arrow-up',
  URGENT: 'exclamation',
} as const;

// Document Icons
export const DOCUMENT_ICONS = {
  PDF: 'file-pdf',
  WORD: 'file-word',
  EXCEL: 'file-excel',
  IMAGE: 'file-image',
  VIDEO: 'file-video',
  AUDIO: 'file-audio',
  ARCHIVE: 'file-archive',
  TEXT: 'file-text',
  CODE: 'file-code',
} as const;

// Social Icons
export const SOCIAL_ICONS = {
  EMAIL: 'mail',
  PHONE: 'phone',
  LINKEDIN: 'linkedin',
  TWITTER: 'twitter',
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
  GITHUB: 'github',
  WEBSITE: 'globe',
} as const;

// Academic Icons
export const ACADEMIC_ICONS = {
  GPA: 'chart-line',
  SAT: 'pencil-alt',
  ACT: 'pencil-alt',
  IELTS: 'language',
  TOEFL: 'language',
  TRANSCRIPT: 'scroll',
  DIPLOMA: 'certificate',
  DEGREE: 'graduation-cap',
  SCHOOL: 'school',
  BOOK: 'book',
  LIBRARY: 'library',
} as const;

// Activity Icons
export const ACTIVITY_ICONS = {
  SPORTS: 'running',
  MUSIC: 'music',
  ART: 'palette',
  VOLUNTEER: 'hands-helping',
  LEADERSHIP: 'crown',
  RESEARCH: 'microscope',
  INTERNSHIP: 'briefcase',
  COMPETITION: 'trophy',
  CLUB: 'users',
  PROJECT: 'project-diagram',
} as const;

// Booking & Events Icons
export const BOOKING_ICONS = {
  BOOKING: 'calendar',
  EVENT: 'calendar',
  SESSION: 'clock',
  MENTOR: 'user',
} as const;

// University Icons
export const UNIVERSITY_ICONS = {
  UNIVERSITY: 'university',
  FAVORITE: 'star',
  RANKING: 'trophy',
  LOCATION: 'globe',
} as const;

// All Icons Combined
export const ALL_ICONS = {
  ...PROFILE_ICONS,
  ...APPLICATION_ICONS,
  ...ESSAY_ICONS,
  ...NAVIGATION_ICONS,
  ...ACTION_ICONS,
  ...STATUS_ICONS,
  ...PRIORITY_ICONS,
  ...DOCUMENT_ICONS,
  ...SOCIAL_ICONS,
  ...ACADEMIC_ICONS,
  ...ACTIVITY_ICONS,
  ...BOOKING_ICONS,
  ...UNIVERSITY_ICONS,
} as const;

// Icon Size Constants
export const ICON_SIZES = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
  '2XL': '2xl',
} as const;

// Icon Color Constants (TopCoach brand colors)
export const ICON_COLORS = {
  PRIMARY: '#8b0000', // TopCoach crimson
  SECONDARY: '#666666',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
  GRAY: '#6b7280',
  WHITE: '#ffffff',
  BLACK: '#000000',
  DEFAULT: 'currentColor',
} as const;
