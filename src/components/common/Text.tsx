/**
 * Text Component
 * Themed text component with typography presets
 */

import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
  TextStyle,
} from 'react-native';
import { Typography, LightColors, DarkColors, FontWeight } from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type TypographyVariant = keyof typeof Typography;
type TextColor = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'error' | 'success' | 'warning';

interface TextProps extends RNTextProps {
  /** Typography variant preset */
  variant?: TypographyVariant;
  /** Text color variant */
  color?: TextColor;
  /** Custom color override */
  customColor?: string;
  /** Center text */
  center?: boolean;
  /** Make text bold */
  bold?: boolean;
  /** Make text medium weight */
  medium?: boolean;
  children: React.ReactNode;
}

const colorMap: Record<TextColor, { light: string; dark: string }> = {
  primary: { light: LightColors.textPrimary, dark: DarkColors.textPrimary },
  secondary: { light: LightColors.textSecondary, dark: DarkColors.textSecondary },
  tertiary: { light: LightColors.textTertiary, dark: DarkColors.textTertiary },
  inverse: { light: LightColors.textInverse, dark: DarkColors.textInverse },
  error: { light: '#F44336', dark: '#EF5350' },
  success: { light: '#4CAF50', dark: '#81C784' },
  warning: { light: '#FF9800', dark: '#FFB74D' },
};

export function Text({
  variant = 'body',
  color = 'primary',
  customColor,
  center,
  bold,
  medium,
  style,
  children,
  ...props
}: TextProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const typographyStyle = Typography[variant];
  const textColor = customColor ?? colorMap[color][colorScheme];

  const combinedStyle: TextStyle = {
    ...typographyStyle,
    color: textColor,
    ...(center && { textAlign: 'center' }),
    ...(bold && { fontWeight: FontWeight.bold }),
    ...(medium && { fontWeight: FontWeight.medium }),
  };

  return (
    <RNText style={[combinedStyle, style]} {...props}>
      {children}
    </RNText>
  );
}

// Convenience components for common typography variants
export function Heading1(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h1" {...props} />;
}

export function Heading2(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h2" {...props} />;
}

export function Heading3(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h3" {...props} />;
}

export function Heading4(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h4" {...props} />;
}

export function BodyText(props: Omit<TextProps, 'variant'>) {
  return <Text variant="body" {...props} />;
}

export function Caption(props: Omit<TextProps, 'variant'>) {
  return <Text variant="caption" color="secondary" {...props} />;
}

export function Label(props: Omit<TextProps, 'variant'>) {
  return <Text variant="label" {...props} />;
}
