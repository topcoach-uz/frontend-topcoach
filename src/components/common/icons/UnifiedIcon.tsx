/**
 * Unified Icon Component
 *
 * Provides a consistent icon interface backed by lucide-react.
 * Usage:
 *   <UnifiedIcon name="home" size="md" color="primary" />
 */

import React from 'react';
import {
  Activity, AlertCircle, ArrowDown, ArrowUp, ArrowUpDown,
  Award, BarChart2, Bell, BookOpen, Boxes, Brain, Briefcase,
  Building, Calendar, Check, CheckCircle2, Clock, Clipboard, ClipboardList,
  Compass, Copy, Download, File, FileAudio, FileArchive,
  FileCode, FileImage, FileSpreadsheet, FileText, FileVideo,
  Filter, Flag, Folder, GraduationCap, Globe, GitBranch,
  HeartHandshake, HelpCircle, Home, IdCard, Info, Languages,
  LayoutDashboard, Lightbulb, ListChecks,
  Loader2, Lock, LogOut, Mail, Menu, MessageCircle, MessageSquare,
  Microscope, Minus, Music, Network, NotebookPen, Palette, Pen, PenLine,
  Pencil, Phone, PieChart, Plus, PlusCircle, Printer, RefreshCw,
  Rocket, Save, School, ScrollText, Search, Settings, Share2, Sparkles,
  Star, Target, TrendingUp, Trash2, Trophy, Upload, User, Users,
  Wand2, X, Zap,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  // Navigation
  dashboard: LayoutDashboard,
  home: Home,
  compass: Compass,
  profile: User,
  user: User,
  'user-circle': User,

  // Applications & Universities
  applications: Clipboard,
  'application-form': Clipboard,
  layers: Clipboard,
  clipboard: Clipboard,
  'check-square': CheckCircle2,
  building: Building,
  university: Building,
  'building-2': Building,

  // Essays & Writing
  essays: Pencil,
  pen: Pen,
  edit: Pencil,
  'pen-tool': PenLine,
  'pen-fancy': PenLine,

  // Documents & Files
  documents: FileText,
  file: File,
  'file-text': FileText,
  'file-alt': FileText,
  'folder-open': Folder,
  folder: Folder,
  files: File,

  // Tools
  calculator: Settings,
  settings: Settings,
  cog: Settings,

  // Notifications
  bell: Bell,
  notifications: Bell,

  // Charts
  'chart-line': TrendingUp,
  trending: TrendingUp,
  'trending-up': TrendingUp,
  psychometric: TrendingUp,
  'major-match': Sparkles,
  'brain-assessment': Brain,
  activity: Activity,
  'bar-chart': BarChart2,
  'chart-bar': BarChart2,
  'pie-chart': PieChart,
  target: Target,

  // Academic
  book: BookOpen,
  programs: BookOpen,
  'graduation-cap': GraduationCap,
  academic: GraduationCap,

  // Achievements
  star: Star,
  opportunities: Star,
  trophy: Trophy,
  activities: Award,
  award: Award,
  scholarships: Award,
  crown: Trophy,
  'admissions-program': Award,

  // Calendar & Time
  calendar: Calendar,
  'calendar-alt': Calendar,
  clock: Clock,
  deadlines: Clock,
  booking: Calendar,

  // Status
  'check-circle': CheckCircle2,
  success: CheckCircle2,
  complete: CheckCircle2,
  check: Check,
  'alert-circle': AlertCircle,
  warning: AlertCircle,
  error: AlertCircle,
  info: Info,
  'info-circle': Info,

  // Actions
  plus: Plus,
  add: Plus,
  'plus-circle': PlusCircle,
  x: X,
  cancel: X,
  times: X,
  trash: Trash2,
  delete: Trash2,
  'trash-2': Trash2,
  download: Download,
  upload: Upload,
  search: Search,
  filter: Filter,

  // Help
  'question-circle': HelpCircle,
  help: HelpCircle,
  'help-circle': HelpCircle,

  // Auth
  'sign-out-alt': LogOut,
  logout: LogOut,
  'log-out': LogOut,

  // Social
  mail: Mail,
  email: Mail,
  envelope: Mail,
  phone: Phone,
  message: MessageCircle,
  'message-circle': MessageCircle,

  // Additional
  'tachometer-alt': Target,
  tasks: ListChecks,
  brain: Brain,
  comments: MessageSquare,
  'code-branch': GitBranch,
  users: Users,
  'full-support': HeartHandshake,
  'users-outline': Users,
  magic: Wand2,
  microscope: Microscope,
  lightbulb: Lightbulb,
  flag: Flag,
  exclamation: AlertCircle,
  'file-pdf': FileText,
  'file-word': FileText,
  'file-excel': FileSpreadsheet,
  'file-image': FileImage,
  'file-video': FileVideo,
  'file-audio': FileAudio,
  'file-archive': FileArchive,
  'file-code': FileCode,
  linkedin: Globe,
  twitter: Globe,
  facebook: Globe,
  instagram: Globe,
  github: Globe,
  globe: Globe,
  website: Globe,
  language: Languages,
  'pencil-alt': PenLine,
  scroll: ScrollText,
  certificate: Award,
  school: School,
  library: BookOpen,
  running: Activity,
  music: Music,
  palette: Palette,
  'hands-helping': Users,
  mentors: Users,
  admissions: ClipboardList,
  'admissions-counselor': ClipboardList,
  sat: NotebookPen,
  'project-diagram': Network,
  spinner: Loader2,
  sync: RefreshCw,
  refresh: RefreshCw,
  'id-card': IdCard,
  briefcase: Briefcase,
  'arrow-down': ArrowDown,
  'arrow-up': ArrowUp,
  minus: Minus,
  save: Save,
  copy: Copy,
  share: Share2,
  'share-2': Share2,
  print: Printer,
  sort: ArrowUpDown,
  'arrow-up-down': ArrowUpDown,
  bars: Menu,
  menu: Menu,
};

const SIZE_MAP: Record<string, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

const COLOR_MAP: Record<string, string> = {
  primary: '#8b0000',
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

const UnifiedIcon: React.FC<UnifiedIconProps> = ({
  name,
  size = 'md',
  color = 'default',
  className = '',
  style = {},
  onClick,
}) => {
  const IconComponent = ICON_MAP[name.toLowerCase()] ?? HelpCircle;
  const iconSize = typeof size === 'number' ? size : SIZE_MAP[size] ?? SIZE_MAP.md;
  const iconColor = COLOR_MAP[color] ?? color ?? 'currentColor';

  return (
    <IconComponent
      size={iconSize}
      color={iconColor}
      className={className}
      style={style}
      onClick={onClick}
      aria-hidden
    />
  );
};

export default UnifiedIcon;
