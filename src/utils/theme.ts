export const colors = {
  bg: '#09090B',
  surface: '#131316',
  surfaceHover: '#1C1C21',
  surfaceAlt: '#17171B',
  border: '#232329',
  borderHover: '#2E2E36',
  textPrimary: '#F4F4F5',
  textSecondary: '#71717A',
  textMuted: '#52525B',
  accent: '#FF6B2B',
  accentHover: '#FF7D42',
  accentMuted: 'rgba(255,107,43,0.12)',
  success: '#22C55E',
  successMuted: 'rgba(34,197,94,0.12)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245,158,11,0.12)',
  error: '#EF4444',
  errorMuted: 'rgba(239,68,68,0.12)',
  info: '#3B82F6',
  infoMuted: 'rgba(59,130,246,0.12)',
  purple: '#A855F7',
  purpleMuted: 'rgba(168,85,247,0.12)',
  pink: '#EC4899',
  glass: 'rgba(19,19,22,0.8)',
  glassBorder: 'rgba(255,255,255,0.06)',
  shadow: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
  shadowLg: '0 10px 30px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)',
} as const;

// Distinct per-client color palette — cycle by index
export const CLIENT_PALETTE = [
  '#FF6B2B', // orange
  '#3B82F6', // blue
  '#A855F7', // purple
  '#22C55E', // green
  '#EC4899', // pink
  '#F59E0B', // amber
  '#06B6D4', // cyan
  '#EF4444', // red
  '#8B5CF6', // violet
  '#10B981', // emerald
  '#F97316', // orange-alt
  '#6366F1', // indigo
] as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
