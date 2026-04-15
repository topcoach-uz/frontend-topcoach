/**
 * FontAwesomeIcon compatibility wrapper
 *
 * Drop-in replacement that renders Lucide icons using the same string-name API
 * that was previously used with @fortawesome/react-fontawesome.
 * All existing callers continue to work without changes.
 */
import React from 'react';
import {
  Activity, AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, ArrowUpDown,
  Award, BarChart2, Bell, BellOff, BookOpen, Boxes, Brain, Briefcase,
  Building, Building2, Calendar, CalendarDays, CalendarRange,
  Check, CheckCheck, CheckCircle2, Clock, Coffee, Compass, CreditCard,
  File, FileText, Filter, Flag, FlaskConical, Folder, GitBranch,
  GraduationCap, Globe, HelpCircle, History, Home,
  IdCard, Info, Languages, Layers, Library, Lightbulb, ListChecks,
  Loader2, Lock, LogIn, LogOut, Mail, MapPin, Menu, MessageCircle,
  MessageSquare, Microscope, Minus, Music, Network, Package, Palette,
  Pen, PenLine, Pencil, Phone, PlayCircle, Plus, PlusCircle, Printer,
  Radio, RefreshCw, RotateCcw, Rocket, Save, School, ScrollText,
  Search, Settings, Share2, Shirt, Smartphone, Star,
  Target, TrendingUp, Trash2, Trophy, Unlock, Upload, User, UserPlus,
  Users, Wallet, Wand2, X, XCircle, Zap,
  type LucideIcon,
} from 'lucide-react';

// Map FontAwesome icon name strings → Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  'activity': Activity,
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  'exclamation-circle': AlertCircle,
  'exclamation': AlertTriangle,
  'exclamation-triangle': AlertTriangle,
  'fas fa-exclamation-circle': AlertCircle,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up-down': ArrowUpDown,
  'arrows-alt-v': ArrowUpDown,
  'award': Award,
  'certificate': Award,
  'bar-chart': BarChart2,
  'bar-chart-2': BarChart2,
  'chart-bar': BarChart2,
  'bell': Bell,
  'bell-slash': BellOff,
  'book': BookOpen,
  'book-open': BookOpen,
  'library': Library,
  'boxes-stacked': Boxes,
  'brain': Brain,
  'briefcase': Briefcase,
  'building': Building,
  'building-2': Building2,
  'university': Building2,
  'calendar': Calendar,
  'calendar-alt': Calendar,
  'calendar-day': CalendarDays,
  'calendar-week': CalendarRange,
  'check': Check,
  'check-double': CheckCheck,
  'check-circle': CheckCircle2,
  'check-square': CheckCircle2,
  'clock': Clock,
  'mug-hot': Coffee,
  'compass': Compass,
  'code-branch': GitBranch,
  'credit-card': CreditCard,
  'edit': Pencil,
  'pen': Pen,
  'pen-alt': Pen,
  'pencil-alt': PenLine,
  'pencil': Pencil,
  'pen-fancy': PenLine,
  'pen-tool': PenLine,
  'file': File,
  'file-alt': FileText,
  'file-text': FileText,
  'file-pdf': FileText,
  'file-word': FileText,
  'file-excel': FileText,
  'file-image': FileText,
  'file-video': FileText,
  'file-audio': FileText,
  'file-archive': FileText,
  'file-code': FileText,
  'filter': Filter,
  'flag': Flag,
  'flask': FlaskConical,
  'folder': Folder,
  'folder-open': Folder,
  'graduation-cap': GraduationCap,
  'globe': Globe,
  'language': Languages,
  'languages': Languages,
  'help-circle': HelpCircle,
  'question-circle': HelpCircle,
  'history': History,
  'home': Home,
  'dashboard': Home,
  'tachometer-alt': Home,
  'id-card': IdCard,
  'info': Info,
  'info-circle': Info,
  'layers': Layers,
  'lightbulb': Lightbulb,
  'list-checks': ListChecks,
  'tasks': ListChecks,
  'loader': Loader2,
  'spinner': Loader2,
  'lock': Lock,
  'log-in': LogIn,
  'sign-in-alt': LogIn,
  'log-out': LogOut,
  'sign-out-alt': LogOut,
  'logout': LogOut,
  'mail': Mail,
  'envelope': Mail,
  'map-pin': MapPin,
  'location': MapPin,
  'menu': Menu,
  'bars': Menu,
  'message-circle': MessageCircle,
  'message': MessageCircle,
  'comments': MessageSquare,
  'microscope': Microscope,
  'minus': Minus,
  'music': Music,
  'network': Network,
  'project-diagram': Network,
  'package': Package,
  'palette': Palette,
  'art': Palette,
  'phone': Phone,
  'play': PlayCircle,
  'play-circle': PlayCircle,
  'plus': Plus,
  'plus-circle': PlusCircle,
  'add': Plus,
  'print': Printer,
  'printer': Printer,
  'radio': Radio,
  'refresh': RefreshCw,
  'sync': RefreshCw,
  'fas fa-refresh': RefreshCw,
  'redo': RotateCcw,
  'redo-alt': RotateCcw,
  'fas fa-redo': RotateCcw,
  'rocket': Rocket,
  'save': Save,
  'floppy-disk': Save,
  'school': School,
  'scroll': ScrollText,
  'scroll-text': ScrollText,
  'search': Search,
  'settings': Settings,
  'cog': Settings,
  'cogs': Settings,
  'share': Share2,
  'share-2': Share2,
  'shirt': Shirt,
  'smartphone': Smartphone,
  'mobile': Smartphone,
  'mobile-alt': Smartphone,
  'magic': Wand2,
  'wand': Wand2,
  'star': Star,
  'target': Target,
  'trending-up': TrendingUp,
  'chart-line': TrendingUp,
  'trash': Trash2,
  'trash-2': Trash2,
  'delete': Trash2,
  'trophy': Trophy,
  'crown': Trophy,
  'unlock': Unlock,
  'upload': Upload,
  'user': User,
  'user-circle': User,
  'user-plus': UserPlus,
  'users': Users,
  'wallet': Wallet,
  'x': X,
  'times': X,
  'cancel': X,
  'times-circle': XCircle,
  'x-circle': XCircle,
  'close': X,
  'zap': Zap,
  'bolt': Zap,
};

const SIZE_MAP: Record<string, number> = {
  xs: 12,
  sm: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
};

interface FontAwesomeIconProps {
  icon: string | any;
  className?: string;
  size?: 'xs' | 'sm' | 'lg' | 'xl' | '2xl';
  color?: string;
  spin?: boolean;
  pulse?: boolean;
  fixedWidth?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  // Legacy @fortawesome props — accepted but not applied
  inverse?: boolean;
  flip?: string;
  rotation?: number;
  transform?: string;
  mask?: any;
  symbol?: string | boolean;
  title?: string;
  titleId?: string;
}

const FontAwesomeIcon: React.FC<FontAwesomeIconProps> = ({
  icon,
  className = '',
  size = 'sm',
  color,
  spin = false,
  style = {},
  onClick,
}) => {
  const iconName = typeof icon === 'string' ? icon : '';
  // Try exact match first, then strip "fas fa-" / "far fa-" prefix as fallback
  const IconComponent =
    ICON_MAP[iconName] ??
    ICON_MAP[iconName.replace(/^fa[srb]\s+fa-/, '')] ??
    HelpCircle;

  const pixelSize = SIZE_MAP[size] ?? 16;

  const computedStyle: React.CSSProperties = spin
    ? { animation: 'spin 1s linear infinite', ...style, color }
    : { ...style, color };

  return (
    <IconComponent
      size={pixelSize}
      className={className}
      style={computedStyle}
      onClick={onClick}
      aria-hidden
    />
  );
};

export default FontAwesomeIcon;
