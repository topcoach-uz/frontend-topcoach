/**
 * Unified Icon Component
 * 
 * Provides a consistent icon interface using react-icons.
 * Primary: Feather Icons (fi) - modern, clean, consistent
 * Fallback: FontAwesome (fa) - for icons not in Feather
 * 
 * Usage:
 * <UnifiedIcon name="home" size="md" color="primary" />
 * <UnifiedIcon name="dashboard" size="lg" />
 */

import React from 'react';
import * as FiIcons from 'react-icons/fi'; // Feather Icons (primary - modern, clean)
import * as FaIcons from 'react-icons/fa'; // FontAwesome (fallback)

// Icon name to component mapping (Feather Icons as primary)
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  // Navigation
  dashboard: FiIcons.FiHome,
  home: FiIcons.FiHome,
  compass: FiIcons.FiCompass,
  profile: FiIcons.FiUser,
  user: FiIcons.FiUser,
  'user-circle': FiIcons.FiUser,
  
  // Applications & Universities
  applications: FiIcons.FiLayers,
  'application-form': FiIcons.FiLayers,
  layers: FiIcons.FiLayers,
  clipboard: FiIcons.FiClipboard,
  'check-square': FiIcons.FiCheckSquare,
  building: FaIcons.FaBuilding,
  university: FaIcons.FaBuilding,
  'building-2': FaIcons.FaBuilding,
  
  // Essays & Writing
  essays: FiIcons.FiEdit,
  pen: FiIcons.FiEdit,
  edit: FiIcons.FiEdit,
  'pen-tool': FiIcons.FiEdit,
  'pen-fancy': FiIcons.FiEdit,
  
  // Documents & Files
  documents: FiIcons.FiFileText,
  file: FiIcons.FiFileText,
  'file-text': FiIcons.FiFileText,
  'file-alt': FiIcons.FiFileText,
  'folder-open': FiIcons.FiFolder,
  folder: FiIcons.FiFolder,
  files: FiIcons.FiFile,
  
  // Tools & Utilities
  calculator: FaIcons.FaCalculator,
  settings: FiIcons.FiSettings,
  cog: FiIcons.FiSettings,
  
  // Notifications & Alerts
  bell: FiIcons.FiBell,
  notifications: FiIcons.FiBell,
  
  // Charts & Analytics
  'chart-line': FiIcons.FiTrendingUp,
  trending: FiIcons.FiTrendingUp,
  'trending-up': FiIcons.FiTrendingUp,
  'psychometric': FiIcons.FiTrendingUp,
  'major-match': FiIcons.FiActivity,
  'brain-assessment': FiIcons.FiActivity,
  activity: FiIcons.FiActivity,
  'bar-chart': FiIcons.FiBarChart2,
  'chart-bar': FiIcons.FiBarChart2,
  'pie-chart': FiIcons.FiPieChart,
  target: FiIcons.FiTarget,
  
  // Academic
  book: FiIcons.FiBook,
  programs: FiIcons.FiBook,
  'graduation-cap': FaIcons.FaGraduationCap,
  academic: FaIcons.FaGraduationCap,
  
  // Opportunities & Achievements
  star: FiIcons.FiStar,
  opportunities: FiIcons.FiStar,
  trophy: FiIcons.FiAward,
  activities: FiIcons.FiAward,
  award: FiIcons.FiAward,
  scholarships: FiIcons.FiAward,
  crown: FiIcons.FiAward,
  'admissions-program': FiIcons.FiAward,
  
  // Calendar & Time
  calendar: FiIcons.FiCalendar,
  'calendar-alt': FiIcons.FiCalendar,
  clock: FiIcons.FiClock,
  deadlines: FiIcons.FiClock,
  booking: FiIcons.FiCalendar,
  
  // Status Icons
  'check-circle': FiIcons.FiCheckCircle,
  success: FiIcons.FiCheckCircle,
  complete: FiIcons.FiCheckCircle,
  check: FiIcons.FiCheck,
  'alert-circle': FiIcons.FiAlertCircle,
  warning: FiIcons.FiAlertCircle,
  error: FiIcons.FiAlertCircle,
  info: FiIcons.FiInfo,
  'info-circle': FiIcons.FiInfo,
  
  // Actions
  plus: FiIcons.FiPlus,
  add: FiIcons.FiPlus,
  'plus-circle': FiIcons.FiPlusCircle,
  x: FiIcons.FiX,
  cancel: FiIcons.FiX,
  times: FiIcons.FiX,
  trash: FiIcons.FiTrash2,
  delete: FiIcons.FiTrash2,
  'trash-2': FiIcons.FiTrash2,
  download: FiIcons.FiDownload,
  upload: FiIcons.FiUpload,
  search: FiIcons.FiSearch,
  filter: FiIcons.FiFilter,
  
  // Help & Support
  'question-circle': FiIcons.FiHelpCircle,
  help: FiIcons.FiHelpCircle,
  'help-circle': FiIcons.FiHelpCircle,
  
  // Auth
  'sign-out-alt': FiIcons.FiLogOut,
  logout: FiIcons.FiLogOut,
  'log-out': FiIcons.FiLogOut,
  
  // Social & Communication
  mail: FiIcons.FiMail,
  email: FiIcons.FiMail,
  envelope: FiIcons.FiMail,
  phone: FiIcons.FiPhone,
  message: FiIcons.FiMessageCircle,
  'message-circle': FiIcons.FiMessageCircle,
  
  // Additional (using FontAwesome fallback)
  'tachometer-alt': FaIcons.FaTachometerAlt,
  tasks: FaIcons.FaTasks,
  brain: FaIcons.FaBrain,
  comments: FaIcons.FaComments,
  'code-branch': FaIcons.FaCodeBranch,
  users: FaIcons.FaUsers,
  magic: FaIcons.FaMagic,
  microscope: FaIcons.FaMicroscope,
  lightbulb: FaIcons.FaLightbulb,
  flag: FaIcons.FaFlag,
  exclamation: FaIcons.FaExclamation,
  'file-pdf': FaIcons.FaFilePdf,
  'file-word': FaIcons.FaFileWord,
  'file-excel': FaIcons.FaFileExcel,
  'file-image': FaIcons.FaFileImage,
  'file-video': FaIcons.FaFileVideo,
  'file-audio': FaIcons.FaFileAudio,
  'file-archive': FaIcons.FaFileArchive,
  'file-code': FaIcons.FaFileCode,
  linkedin: FaIcons.FaLinkedin,
  twitter: FaIcons.FaTwitter,
  facebook: FaIcons.FaFacebook,
  instagram: FaIcons.FaInstagram,
  github: FaIcons.FaGithub,
  globe: FaIcons.FaGlobe,
  website: FaIcons.FaGlobe,
  language: FaIcons.FaLanguage,
  'pencil-alt': FaIcons.FaPencilAlt,
  scroll: FaIcons.FaScroll,
  certificate: FaIcons.FaCertificate,
  school: FaIcons.FaSchool,
  library: FaIcons.FaBook,
  running: FaIcons.FaRunning,
  music: FaIcons.FaMusic,
  palette: FaIcons.FaPalette,
  'hands-helping': FaIcons.FaHandsHelping,
  'project-diagram': FaIcons.FaProjectDiagram,
  spinner: FaIcons.FaSpinner,
  sync: FaIcons.FaSync,
  refresh: FaIcons.FaSync,
  'id-card': FaIcons.FaIdCard,
  briefcase: FaIcons.FaBriefcase,
  'arrow-down': FiIcons.FiArrowDown,
  'arrow-up': FiIcons.FiArrowUp,
  minus: FiIcons.FiMinus,
  save: FaIcons.FaSave,
  copy: FiIcons.FiCopy,
  share: FiIcons.FiShare2,
  'share-2': FiIcons.FiShare2,
  print: FiIcons.FiPrinter,
  sort: FaIcons.FaArrowsAltV,
  'arrow-up-down': FaIcons.FaArrowsAltV,
  bars: FiIcons.FiMenu,
  menu: FiIcons.FiMenu,
};

// Size mapping (in pixels)
const SIZE_MAP: Record<string, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

// Color mapping (using TopCoach brand colors)
const COLOR_MAP: Record<string, string> = {
  primary: '#8b0000', // TopCoach crimson
  secondary: '#666666',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  gray: '#6b7280',
  white: '#ffffff',
  black: '#000000',
  default: 'currentColor',
};

export interface UnifiedIconProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'gray' | 'white' | 'black' | 'default' | string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * Unified Icon Component
 * 
 * Provides a consistent icon interface using react-icons.
 * Primary: Feather Icons (modern, clean, consistent)
 * Fallback: FontAwesome (for icons not in Feather)
 */
const UnifiedIcon: React.FC<UnifiedIconProps> = ({
  name,
  size = 'md',
  color = 'default',
  className = '',
  style = {},
  onClick,
}) => {
  // Get icon component from map
  const IconComponent = ICON_MAP[name.toLowerCase()];
  
  // Calculate size
  const iconSize = typeof size === 'number' ? size : SIZE_MAP[size] || SIZE_MAP.md;
  
  // Calculate color
  const iconColor = COLOR_MAP[color] || color || 'currentColor';
  
  // If icon not found, return null or a default icon
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in UnifiedIcon map. Using default.`);
    return <FiIcons.FiHelpCircle size={iconSize} color={iconColor} className={className} style={style} onClick={onClick} />;
  }
  
  return (
    <IconComponent
      size={iconSize}
      color={iconColor}
      className={className}
      style={style}
      onClick={onClick}
    />
  );
};

export default UnifiedIcon;
