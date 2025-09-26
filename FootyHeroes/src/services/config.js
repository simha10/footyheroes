import { Platform } from 'react-native';

// API Configuration
export const API_BASE_URL = Platform.OS === 'ios' 
  ? 'http://localhost:5000/api'
  : 'http://10.0.2.2:5000/api';

export const SOCKET_URL = Platform.OS === 'ios' 
  ? 'http://localhost:5000'
  : 'http://10.0.2.2:5000';

// App Configuration
export const APP_CONFIG = {
  name: 'FootyHeroes',
  version: '1.0.0',
  description: 'Football Match Organization Platform',
};

// Football Position Constants
export const FOOTBALL_POSITIONS = [
  'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'
];

// Skill Levels
export const SKILL_LEVELS = [
  'Beginner',
  'Intermediate', 
  'Advanced',
  'Semi-Pro',
  'Professional'
];

// Match Formats
export const MATCH_FORMATS = [
  { value: '5v5', label: '5 vs 5', players: 10 },
  { value: '7v7', label: '7 vs 7', players: 14 },
  { value: '11v11', label: '11 vs 11', players: 22 }
];

// Match Types
export const MATCH_TYPES = [
  { value: 'public', label: 'Public Match' },
  { value: 'private', label: 'Private Match' }
];

// Payment Methods
export const PAYMENT_METHODS = [
  { value: 'free', label: 'Free' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'app', label: 'App Payment' }
];

// Message Types
export const MESSAGE_TYPES = [
  'text',
  'media',
  'location', 
  'poll',
  'reaction'
];

// Media Types
export const MEDIA_TYPES = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' }
];

// Report Categories
export const REPORT_CATEGORIES = [
  'unsportsmanlike_conduct',
  'abusive_language',
  'physical_aggression',
  'no_show',
  'late_arrival',
  'cheating',
  'harassment',
  'discrimination',
  'other'
];

// Severity Levels
export const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', priority: 1 },
  { value: 'medium', label: 'Medium', priority: 2 },
  { value: 'high', label: 'High', priority: 4 },
  { value: 'critical', label: 'Critical', priority: 5 }
];

// Colors
export const COLORS = {
  primary: '#FF6B35',
  secondary: '#004E89', 
  accent: '#51FF0D',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  border: '#E0E0E0',
  error: '#FF4444',
  warning: '#FF8800',
  success: '#00C851',
  info: '#2196F3',
};

// Fonts
export const FONTS = {
  regular: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  medium: Platform.OS === 'ios' ? 'HelveticaNeue-Medium' : 'Roboto-Medium',
  bold: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'Roboto-Bold',
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};
