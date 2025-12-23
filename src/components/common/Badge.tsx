/**
 * Badge Component
 * Status indicators and labels
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import {
  BrandColors,
  SemanticColors,
  LightColors,
  DarkColors,
  BorderRadius,
  Spacing,
  LocationColors,
  CompletionColors,
} from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Text } from './Text';
import { LocationType, QuarterStatus } from '@/src/types';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  /** Badge text */
  label: string;
  /** Badge variant */
  variant?: BadgeVariant;
  /** Badge size */
  size?: BadgeSize;
  /** Custom background color */
  backgroundColor?: string;
  /** Custom text color */
  textColor?: string;
  /** Container style */
  style?: ViewStyle;
  /** Show as outline style */
  outline?: boolean;
}

const variantStyles = {
  primary: {
    background: BrandColors.primary,
    backgroundLight: 'rgba(0, 102, 204, 0.15)',
    text: '#FFFFFF',
    textOutline: BrandColors.primary,
  },
  secondary: {
    background: BrandColors.secondary,
    backgroundLight: 'rgba(0, 206, 209, 0.15)',
    text: '#FFFFFF',
    textOutline: BrandColors.secondary,
  },
  success: {
    background: SemanticColors.success,
    backgroundLight: SemanticColors.successBackground,
    text: '#FFFFFF',
    textOutline: SemanticColors.success,
  },
  warning: {
    background: SemanticColors.warning,
    backgroundLight: SemanticColors.warningBackground,
    text: '#FFFFFF',
    textOutline: SemanticColors.warningDark,
  },
  error: {
    background: SemanticColors.error,
    backgroundLight: SemanticColors.errorBackground,
    text: '#FFFFFF',
    textOutline: SemanticColors.error,
  },
  info: {
    background: SemanticColors.info,
    backgroundLight: SemanticColors.infoBackground,
    text: '#FFFFFF',
    textOutline: SemanticColors.info,
  },
  neutral: {
    background: '#6B7280',
    backgroundLight: '#F3F4F6',
    text: '#FFFFFF',
    textOutline: '#6B7280',
  },
};

const sizeStyles = {
  small: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 10,
  },
  medium: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  large: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    fontSize: 14,
  },
};

export function Badge({
  label,
  variant = 'primary',
  size = 'medium',
  backgroundColor,
  textColor,
  style,
  outline = false,
}: BadgeProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor:
            backgroundColor ??
            (outline ? variantStyle.backgroundLight : variantStyle.background),
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
        },
        outline && {
          borderWidth: 1,
          borderColor: variantStyle.textOutline,
        },
        style,
      ]}
    >
      <Text
        variant="labelSmall"
        customColor={
          textColor ?? (outline ? variantStyle.textOutline : variantStyle.text)
        }
        style={{ fontSize: sizeStyle.fontSize }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
});

// Location Type Badge
interface LocationBadgeProps {
  type: LocationType;
  size?: BadgeSize;
  style?: ViewStyle;
}

const locationLabels: Record<LocationType, string> = {
  home: 'Home',
  training: 'Training',
  gym: 'Gym',
  competition: 'Competition',
  work: 'Work',
  school: 'School',
  hotel: 'Hotel',
  other: 'Other',
};

export function LocationBadge({ type, size = 'medium', style }: LocationBadgeProps) {
  return (
    <Badge
      label={locationLabels[type]}
      backgroundColor={LocationColors[type]}
      textColor="#FFFFFF"
      size={size}
      style={style}
    />
  );
}

// Quarter Status Badge
interface StatusBadgeProps {
  status: QuarterStatus;
  size?: BadgeSize;
  style?: ViewStyle;
}

const statusConfig: Record<
  QuarterStatus,
  { label: string; variant: BadgeVariant }
> = {
  draft: { label: 'Draft', variant: 'neutral' },
  incomplete: { label: 'Incomplete', variant: 'warning' },
  complete: { label: 'Complete', variant: 'success' },
  submitted: { label: 'Submitted', variant: 'primary' },
  locked: { label: 'Locked', variant: 'neutral' },
};

export function StatusBadge({ status, size = 'medium', style }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge
      label={config.label}
      variant={config.variant}
      size={size}
      style={style}
    />
  );
}

// Completion Percentage Badge
interface CompletionBadgeProps {
  percentage: number;
  size?: BadgeSize;
  style?: ViewStyle;
}

export function CompletionBadge({ percentage, size = 'medium', style }: CompletionBadgeProps) {
  let variant: BadgeVariant = 'error';
  if (percentage >= 100) {
    variant = 'success';
  } else if (percentage >= 75) {
    variant = 'info';
  } else if (percentage >= 50) {
    variant = 'warning';
  }

  return (
    <Badge
      label={`${Math.round(percentage)}%`}
      variant={variant}
      size={size}
      style={style}
    />
  );
}

// Notification count badge (small dot or number)
interface NotificationBadgeProps {
  count?: number;
  style?: ViewStyle;
}

export function NotificationBadge({ count, style }: NotificationBadgeProps) {
  if (count === undefined || count === 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View style={[notificationStyles.badge, style]}>
      <Text
        variant="labelSmall"
        customColor="#FFFFFF"
        style={notificationStyles.text}
      >
        {displayCount}
      </Text>
    </View>
  );
}

const notificationStyles = StyleSheet.create({
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: SemanticColors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
  },
});
