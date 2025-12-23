/**
 * Card Component
 * Container component with consistent styling
 */

import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  PressableProps,
} from 'react-native';
import {
  LightColors,
  DarkColors,
  BorderRadius,
  Spacing,
  Shadows,
} from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Card padding */
  padding?: 'none' | 'small' | 'medium' | 'large';
  /** Show shadow */
  shadow?: boolean;
  /** Border radius variant */
  rounded?: 'small' | 'medium' | 'large';
}

const paddingMap = {
  none: 0,
  small: Spacing.sm,
  medium: Spacing.md,
  large: Spacing.lg,
};

const radiusMap = {
  small: BorderRadius.sm,
  medium: BorderRadius.md,
  large: BorderRadius.lg,
};

export function Card({
  children,
  style,
  padding = 'medium',
  shadow = true,
  rounded = 'medium',
}: CardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          borderRadius: radiusMap[rounded],
          padding: paddingMap[padding],
        },
        shadow && Shadows.md,
        style,
      ]}
    >
      {children}
    </View>
  );
}

// Pressable Card variant
interface PressableCardProps extends CardProps, Omit<PressableProps, 'style'> {
  onPress: () => void;
}

export function PressableCard({
  children,
  style,
  padding = 'medium',
  shadow = true,
  rounded = 'medium',
  onPress,
  ...props
}: PressableCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed
            ? colors.surfaceVariant
            : colors.card,
          borderColor: colors.cardBorder,
          borderRadius: radiusMap[rounded],
          padding: paddingMap[padding],
        },
        shadow && !pressed && Shadows.md,
        style,
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});

// Section Card - for grouping related content
interface SectionCardProps extends CardProps {
  title?: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export function SectionCard({
  title,
  subtitle,
  rightElement,
  children,
  ...props
}: SectionCardProps) {
  const { Text } = require('./Text');

  return (
    <Card {...props}>
      {(title || rightElement) && (
        <View style={sectionStyles.header}>
          <View style={sectionStyles.headerText}>
            {title && (
              <Text variant="h5" style={sectionStyles.title}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text variant="bodySmall" color="secondary">
                {subtitle}
              </Text>
            )}
          </View>
          {rightElement}
        </View>
      )}
      {children}
    </Card>
  );
}

const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    marginBottom: Spacing.xs,
  },
});
