/**
 * CIOC Athlete App Design System
 *
 * Color palette, typography, spacing, and design tokens
 * Following the brand guidelines for Cayman Islands Olympic Committee
 */

import { Platform, Dimensions } from 'react-native';

// ============================================================================
// DIMENSIONS
// ============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Layout = {
  window: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  isSmallDevice: SCREEN_WIDTH < 375,
  isTablet: SCREEN_WIDTH >= 768,
};

// ============================================================================
// COLORS
// ============================================================================

/**
 * Brand Colors - CIOC Official
 */
export const BrandColors = {
  primary: '#0066CC',        // CIOC Blue
  primaryLight: '#3385D6',
  primaryDark: '#004C99',

  secondary: '#00CED1',      // Caribbean Teal
  secondaryLight: '#40E0D0',
  secondaryDark: '#008B8B',

  accent: '#FFD700',         // Gold (for medals/achievements)
  accentLight: '#FFE44D',
  accentDark: '#CCB000',
} as const;

/**
 * Semantic Colors
 */
export const SemanticColors = {
  success: '#4CAF50',
  successLight: '#81C784',
  successDark: '#388E3C',
  successBackground: '#E8F5E9',

  warning: '#FF9800',
  warningLight: '#FFB74D',
  warningDark: '#F57C00',
  warningBackground: '#FFF3E0',

  error: '#F44336',
  errorLight: '#EF5350',
  errorDark: '#D32F2F',
  errorBackground: '#FFEBEE',

  info: '#2196F3',
  infoLight: '#64B5F6',
  infoDark: '#1976D2',
  infoBackground: '#E3F2FD',
} as const;

/**
 * Light Theme Colors
 */
export const LightColors = {
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F5F7FA',
  backgroundTertiary: '#EEF2F6',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F4F8',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textDisabled: '#D1D5DB',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderFocus: BrandColors.primary,

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.25)',

  // Tab bar
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  tabBarActive: BrandColors.primary,
  tabBarInactive: '#9CA3AF',

  // Cards
  card: '#FFFFFF',
  cardBorder: '#E5E7EB',
  cardShadow: 'rgba(0, 0, 0, 0.08)',
} as const;

/**
 * Dark Theme Colors
 */
export const DarkColors = {
  // Backgrounds
  background: '#121212',
  backgroundSecondary: '#1E1E1E',
  backgroundTertiary: '#2D2D2D',
  surface: '#1E1E1E',
  surfaceVariant: '#2D2D2D',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textTertiary: '#6B6B6B',
  textDisabled: '#4A4A4A',
  textInverse: '#1A1A2E',

  // Borders
  border: '#3D3D3D',
  borderLight: '#2D2D2D',
  borderFocus: BrandColors.primaryLight,

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',

  // Tab bar
  tabBar: '#1E1E1E',
  tabBarBorder: '#3D3D3D',
  tabBarActive: BrandColors.primaryLight,
  tabBarInactive: '#6B6B6B',

  // Cards
  card: '#1E1E1E',
  cardBorder: '#3D3D3D',
  cardShadow: 'rgba(0, 0, 0, 0.3)',
} as const;

/**
 * Location Type Colors
 */
export const LocationColors = {
  home: '#4CAF50',
  training: '#2196F3',
  gym: '#9C27B0',
  competition: '#F44336',
  work: '#FF9800',
  school: '#795548',
  hotel: '#607D8B',
  other: '#9E9E9E',
} as const;

/**
 * Completion Status Colors
 */
export const CompletionColors = {
  complete: '#4CAF50',
  incomplete: '#FF9800',
  missing: '#F44336',
  locked: '#9E9E9E',
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

/**
 * Font Families
 */
export const FontFamily = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  android: {
    regular: 'Roboto',
    medium: 'Roboto-Medium',
    semibold: 'Roboto-Medium',
    bold: 'Roboto-Bold',
  },
  default: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
});

/**
 * Font Sizes
 */
export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 40,
} as const;

/**
 * Line Heights
 */
export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

/**
 * Font Weights (for iOS system font)
 */
export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/**
 * Typography Presets
 */
export const Typography = {
  // Headings
  h1: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['4xl'] * LineHeight.tight,
  },
  h2: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['3xl'] * LineHeight.tight,
  },
  h3: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize['2xl'] * LineHeight.tight,
  },
  h4: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.xl * LineHeight.normal,
  },
  h5: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.lg * LineHeight.normal,
  },
  h6: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.base * LineHeight.normal,
  },

  // Body
  bodyLarge: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.lg * LineHeight.relaxed,
  },
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.base * LineHeight.relaxed,
  },
  bodySmall: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * LineHeight.relaxed,
  },

  // Labels
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.sm * LineHeight.normal,
  },
  labelSmall: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.xs * LineHeight.normal,
  },

  // Caption
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.xs * LineHeight.normal,
  },

  // Button
  button: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  buttonSmall: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.sm * LineHeight.normal,
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================

/**
 * Base unit: 8px
 */
export const Spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 56,
  '5xl': 64,
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

// ============================================================================
// ICONS
// ============================================================================

export const IconSize = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
} as const;

// ============================================================================
// ANIMATION
// ============================================================================

export const Animation = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
  },
} as const;

// ============================================================================
// Z-INDEX
// ============================================================================

export const ZIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
  toast: 700,
} as const;

// ============================================================================
// COMPONENT PRESETS
// ============================================================================

export const ButtonPresets = {
  primary: {
    backgroundColor: BrandColors.primary,
    textColor: '#FFFFFF',
    pressedBackgroundColor: BrandColors.primaryDark,
  },
  secondary: {
    backgroundColor: 'transparent',
    textColor: BrandColors.primary,
    borderColor: BrandColors.primary,
    pressedBackgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  tertiary: {
    backgroundColor: 'transparent',
    textColor: BrandColors.primary,
    pressedBackgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  danger: {
    backgroundColor: SemanticColors.error,
    textColor: '#FFFFFF',
    pressedBackgroundColor: SemanticColors.errorDark,
  },
  success: {
    backgroundColor: SemanticColors.success,
    textColor: '#FFFFFF',
    pressedBackgroundColor: SemanticColors.successDark,
  },
} as const;

export const InputPresets = {
  default: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.base,
  },
  large: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: FontSize.lg,
  },
} as const;

// ============================================================================
// THEME OBJECT
// ============================================================================

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: typeof LightColors & typeof BrandColors & typeof SemanticColors;
  typography: typeof Typography;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  shadows: typeof Shadows;
  iconSize: typeof IconSize;
  animation: typeof Animation;
  zIndex: typeof ZIndex;
}

/**
 * Get theme object for the specified mode
 */
export function getTheme(mode: ThemeMode): Theme {
  const baseColors = mode === 'light' ? LightColors : DarkColors;

  return {
    mode,
    colors: {
      ...baseColors,
      ...BrandColors,
      ...SemanticColors,
    },
    typography: Typography,
    spacing: Spacing,
    borderRadius: BorderRadius,
    shadows: Shadows,
    iconSize: IconSize,
    animation: Animation,
    zIndex: ZIndex,
  };
}

export const LightTheme = getTheme('light');
export const DarkTheme = getTheme('dark');

// ============================================================================
// LEGACY EXPORTS (for backwards compatibility)
// ============================================================================

/**
 * Legacy SPACING export (alias for Spacing)
 */
export const SPACING = Spacing;

/**
 * Legacy COLORS export
 * Consolidated color object for components using the old naming convention
 */
export const COLORS = {
  // Brand colors
  primary: BrandColors.primary,
  primaryLight: BrandColors.primaryLight,
  primaryDark: BrandColors.primaryDark,
  secondary: BrandColors.secondary,
  secondaryLight: BrandColors.secondaryLight,
  secondaryDark: BrandColors.secondaryDark,
  accent: BrandColors.accent,

  // Semantic colors
  success: SemanticColors.success,
  successLight: SemanticColors.successLight,
  successBackground: SemanticColors.successBackground,
  warning: SemanticColors.warning,
  warningLight: SemanticColors.warningLight,
  warningBackground: SemanticColors.warningBackground,
  error: SemanticColors.error,
  errorLight: SemanticColors.errorLight,
  errorBackground: SemanticColors.errorBackground,
  info: SemanticColors.info,
  infoLight: SemanticColors.infoLight,
  infoBackground: SemanticColors.infoBackground,

  // Surface colors (light theme defaults)
  background: LightColors.background,
  backgroundSecondary: LightColors.backgroundSecondary,
  surface: LightColors.surface,
  surfaceVariant: LightColors.surfaceVariant,
  border: LightColors.border,
  borderLight: LightColors.borderLight,

  // Text colors
  text: {
    primary: LightColors.textPrimary,
    secondary: LightColors.textSecondary,
    tertiary: LightColors.textTertiary,
    disabled: LightColors.textDisabled,
    inverse: LightColors.textInverse,
  },
} as const;
