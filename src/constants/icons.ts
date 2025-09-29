// 🎨 FontAwesome Icon Constants for Student Hub
// Centralized icon management for consistent usage

// Profile Icons
export const PROFILE_ICONS = {
  PROFILE: 'user',
  ACADEMIC: 'graduation-cap',
  PERSONAL: 'user-circle',
  ACTIVITIES: 'trophy',
  DOCUMENTS: 'file-alt',
  OVERVIEW: 'chart-pie',
  SETTINGS: 'cog',
} as const;

// Application Icons
export const APPLICATION_ICONS = {
  APPLICATIONS: 'university',
  TASKS: 'tasks',
  SCHOLARSHIPS: 'award',
  TIMELINE: 'calendar-alt',
  DEADLINES: 'clock',
  STATUS: 'flag',
  PRIORITY: 'exclamation',
} as const;

// Essay Icons
export const ESSAY_ICONS = {
  ESSAYS: 'pen-fancy',
  TEMPLATES: 'file-text',
  FEEDBACK: 'comments',
  AI: 'brain',
  VERSIONS: 'code-branch',
  COLLABORATION: 'users',
  ANALYSIS: 'chart-line',
} as const;

// AI Major Match Icons
export const AI_MAJOR_MATCH_ICONS = {
  AI_MAJOR_MATCH: 'magic',
  AI_ANALYSIS: 'microscope',
  AI_RECOMMENDATION: 'lightbulb',
} as const;

// Navigation Icons
export const NAVIGATION_ICONS = {
  DASHBOARD: 'tachometer-alt',
  PROFILE: 'user',
  APPLICATIONS: 'university',
  ESSAYS: 'pen-fancy',
  DOCUMENTS: 'file-alt',
  NOTIFICATIONS: 'bell',
  SETTINGS: 'cog',
  HELP: 'question-circle',
  LOGOUT: 'sign-out-alt',
} as const;

// Action Icons
export const ACTION_ICONS = {
  ADD: 'plus',
  EDIT: 'edit',
  DELETE: 'trash',
  SAVE: 'save',
  CANCEL: 'times',
  CHECK: 'check',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  COPY: 'copy',
  SHARE: 'share',
  PRINT: 'print',
  SEARCH: 'search',
  FILTER: 'filter',
  SORT: 'sort',
  REFRESH: 'sync',
} as const;

// Status Icons
export const STATUS_ICONS = {
  SUCCESS: 'check-circle',
  WARNING: 'exclamation-triangle',
  ERROR: 'times-circle',
  INFO: 'info-circle',
  LOADING: 'spinner',
  PENDING: 'clock',
  COMPLETE: 'check',
  INCOMPLETE: 'times',
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
  TEXT: 'file-alt',
  CODE: 'file-code',
} as const;

// Social Icons
export const SOCIAL_ICONS = {
  EMAIL: 'envelope',
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
} as const;

// Icon Size Constants
export const ICON_SIZES = {
  XS: 'xs',
  SM: 'sm',
  LG: 'lg',
  XL: 'xl',
  '2XL': '2xl',
} as const;

// Icon Color Constants
export const ICON_COLORS = {
  PRIMARY: '#3b82f6',
  SECONDARY: '#22c55e',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
  GRAY: '#6b7280',
  WHITE: '#ffffff',
  BLACK: '#000000',
} as const;