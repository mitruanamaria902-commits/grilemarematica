export const COLORS = {
  // Backgrounds
  background: '#F0F4FF',
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF2FF',

  // Text
  text: '#1A1F36',
  textSecondary: '#4A5568',
  textTertiary: '#9AA5B4',

  // Brand
  primary: '#3B5BDB',
  primaryMuted: 'rgba(59, 91, 219, 0.10)',
  primaryBorder: 'rgba(59, 91, 219, 0.08)',

  // Semantic
  accent: '#22C55E',
  accentMuted: 'rgba(34, 197, 94, 0.12)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.12)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239, 68, 68, 0.12)',

  // Structural
  border: 'rgba(59, 91, 219, 0.08)',
  divider: 'rgba(59, 91, 219, 0.05)',
};

export const DARK_COLORS = {
  background: '#0F1219',
  surface: '#1A2035',
  surfaceSecondary: '#1E2640',

  text: '#E8EEFF',
  textSecondary: '#8B9CC8',
  textTertiary: '#4A5578',

  primary: '#5B7BFF',
  primaryMuted: 'rgba(91, 123, 255, 0.15)',
  primaryBorder: 'rgba(91, 123, 255, 0.12)',

  accent: '#22C55E',
  accentMuted: 'rgba(34, 197, 94, 0.15)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239, 68, 68, 0.15)',

  border: 'rgba(91, 123, 255, 0.12)',
  divider: 'rgba(91, 123, 255, 0.07)',
};

export function getColors(dark: boolean) {
  return dark ? DARK_COLORS : COLORS;
}
